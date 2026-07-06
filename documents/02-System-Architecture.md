# Frame Africa — System Architecture & Design

**Document:** 02 — Architecture
**Version:** 1.0
**Stack:** Next.js (frontend) · Node.js / NestJS (backend) · PostgreSQL

---

## 1. Architectural Goals

1. **Fast for readers** — server-render and edge-cache public pages.
2. **Safe for the newsroom** — a clearly separated, permissioned back office.
3. **Scalable under spikes** — stateless services that scale horizontally.
4. **Maintainable** — modular services, clear contracts, typed end to end.
5. **Secure by design** — every boundary authenticates and validates (see `05`).

## 2. Architectural Style

Frame Africa uses a **modular, layered, service-oriented architecture** with a decoupled frontend and backend communicating over a versioned REST/JSON API. It is neither a rigid monolith nor a sprawling microservice mesh: the backend is a **modular monolith** (NestJS modules) that can be split into services later where load demands it (search, media, notifications, AI already run as separate services).

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                   │
│   Web browser · PWA · Android app · iOS app · Admin/CMS UI         │
└───────────────────────────────┬──────────────────────────────────┘
                                 │ HTTPS
┌───────────────────────────────▼──────────────────────────────────┐
│                    CLOUDFLARE (CDN + WAF)                          │
│   TLS · caching · image resize · rate limiting · DDoS · bot mgmt  │
└───────────────────────────────┬──────────────────────────────────┘
                                 │
┌───────────────────────────────▼──────────────────────────────────┐
│                 NEXT.JS FRONTEND (Node runtime)                    │
│  • SSG for evergreen pages     • ISR for articles                  │
│  • SSR for personalized views  • Route handlers (BFF)              │
│  • i18n routing (en/rw/fr)     • PWA / service worker              │
└───────────────────────────────┬──────────────────────────────────┘
                                 │ REST/JSON (JWT)   ← BFF proxies sensitive calls
┌───────────────────────────────▼──────────────────────────────────┐
│                API GATEWAY / EDGE (NestJS)                         │
│   authN (JWT) · authZ (RBAC) · validation · rate limit · logging  │
└───┬───────────┬───────────┬───────────┬───────────┬──────────────┘
    │           │           │           │           │
┌───▼───┐  ┌────▼────┐  ┌───▼────┐  ┌───▼─────┐  ┌──▼──────────┐
│Content│  │ Users & │  │Comments│  │ Billing │  │ Notifications│
│& CMS  │  │  Auth   │  │  & Mod │  │ & Ads   │  │  service     │
│module │  │ module  │  │ module │  │ module  │  │              │
└───┬───┘  └────┬────┘  └───┬────┘  └───┬─────┘  └──┬──────────┘
    │           │           │           │           │
    │      ┌────▼───────────▼───────────▼───────────▼────┐
    │      │            SHARED DATA LAYER                 │
    │      │  PostgreSQL (primary + read replicas)        │
    │      │  Redis (cache, sessions, rate-limit, queues) │
    │      └──────────────────────────────────────────────┘
    │
┌───▼──────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────┐
│ Search svc   │   │ Media svc    │   │ AI svc       │   │ Payments  │
│ OpenSearch   │   │ S3 + HLS +   │   │ summaries,   │   │ MoMo,     │
│ index/query  │   │ transcoding  │   │ translate,   │   │ Airtel,   │
│              │   │              │   │ moderate     │   │ cards     │
└──────────────┘   └──────────────┘   └──────────────┘   └───────────┘
```

## 3. Layered View

| Layer | Responsibility | Technology |
|---|---|---|
| **Presentation** | Render pages, forms, dashboards | Next.js, React, TypeScript, Tailwind |
| **BFF / Edge** | Aggregate + protect calls, SSR data fetch | Next.js Route Handlers / Server Actions |
| **API / Application** | Business rules, workflow, authZ | NestJS (Node.js), TypeScript |
| **Domain** | Entities, use-case services | NestJS providers |
| **Data** | Persistence & queries | Prisma/TypeORM → PostgreSQL |
| **Infrastructure** | Cache, search, storage, queues | Redis, OpenSearch, S3, BullMQ |

## 4. Frontend Design (Next.js)

**Rendering strategy — choose per page type:**

| Page | Strategy | Why |
|---|---|---|
| Homepage | ISR (short revalidate) + client hydration for live blocks | Fresh but cacheable |
| Article page | ISR (revalidate on publish/update webhook) | Fast + always current |
| Category / archive | SSG/ISR | Cacheable at edge |
| Search results | SSR / client fetch | Query-dependent |
| Reader account, CMS, admin | SSR (auth) / client | Personalized, private |

**Key practices**
- **App Router** with route groups: `(public)`, `(reader)`, `(cms)`, `(admin)`.
- **Server Components** for data-heavy read views; **Client Components** only where interactivity is needed.
- **i18n** via locale-prefixed routes (`/en`, `/rw`, `/fr`) and message catalogs.
- **BFF pattern**: the browser never holds long-lived secrets; sensitive backend calls are proxied through Next.js server code, and tokens live in **HTTP-only, Secure, SameSite cookies**.
- **PWA**: service worker for offline reading and installability.
- **Design tokens** from the brand (dark theme, orange primary) — see `06`.

## 5. Backend Design (Node.js / NestJS)

**Module boundaries** (each = controller + service + repository + DTOs):

- `auth` — registration, login, OAuth, OTP, 2FA, sessions, tokens.
- `users` — profiles, roles, preferences, GDPR export/erasure.
- `content` — articles, revisions, corrections, categories, tags, media links, workflow state machine.
- `media` — upload orchestration, signed URLs, transcoding jobs.
- `comments` — threads, likes, reports, moderation, AI screening hook.
- `billing` — subscriptions, paywall metering, invoices, payment webhooks.
- `ads` — campaigns, placements, notices, click tracking.
- `notifications` — templating, channel fan-out, preferences, quiet hours.
- `newsletter` — lists, digests, delivery tracking.
- `analytics` — event ingestion, aggregation, reporting.
- `ai` — orchestrates external/self-hosted AI calls (advisory only).
- `admin` — settings, feature flags, audit-log access, backups.

**Cross-cutting concerns** implemented as NestJS middleware/guards/interceptors:
- `AuthGuard` (JWT), `RolesGuard` (RBAC), `ThrottlerGuard` (rate limit).
- Global `ValidationPipe` (DTO validation + sanitization).
- Logging + tracing interceptor (request id, user id, latency).
- Central exception filter → standard error envelope (see `04`).

**Async work** via a **Redis-backed queue (BullMQ)**: email/push send, media transcoding, AI jobs, search indexing, newsletter blasts, scheduled publishing.

## 6. Editorial Workflow State Machine

```
Draft → Assigned → In Progress → Copy-edit → Fact-check → Legal review
      → Ready → (Embargoed | Scheduled) → Published → [Correction pending] → Archived
                                              │
                                       Rejected ─┘ (back to In Progress)
```

Transitions are permission-gated: journalists move up to *Ready/Submitted*; only editors move to *Published*, *Archived*, or apply *Corrections*. Every transition is recorded with actor + timestamp.

## 7. Data Flow — "Publish an article"

```
Journalist (CMS) ─create/edit→ Next.js ─POST /articles→ content module
   → validate + save draft + revision (PostgreSQL)
   → media uploaded via signed URL to S3; transcode job queued
Journalist ─submit→ state = Review
Editor ─approve+publish→ state = Published
   → emit "article.published" event
   → search index update (OpenSearch)
   → ISR revalidation webhook to Next.js (page rebuilt)
   → notifications queued (followers, breaking news if flagged)
   → CDN cache warm
Reader ─GET /article/slug→ Cloudflare (hit) or Next.js (ISR) → HTML
```

## 8. Caching Strategy

| Level | What | TTL / Invalidation |
|---|---|---|
| CDN (Cloudflare) | Anonymous HTML, images, assets | Purge on publish/update |
| Next.js ISR | Rendered article/category pages | Revalidate on webhook |
| Redis | Hot queries, sessions, rate counters, paywall counts | Seconds–minutes |
| Client | Static assets, offline articles (SW) | Versioned |

Personalized and authenticated responses are **never** cached at the CDN.

## 9. Environments

| Env | Purpose |
|---|---|
| Local | Developer machines (Docker Compose) |
| Staging | Mirror of prod; preview links for editors; QA |
| Production | Live, auto-scaled, multi-AZ |

## 10. Technology Decisions (rationale)

| Decision | Choice | Reason |
|---|---|---|
| Frontend framework | Next.js | SSR/ISR for SEO + speed, strong ecosystem |
| Backend framework | NestJS on Node | Modular, typed, testable, same language as FE |
| DB | PostgreSQL | Relational integrity, JSONB flexibility, full-text fallback |
| Search | OpenSearch | Fast relevance, facets, typo tolerance |
| Cache/queue | Redis + BullMQ | Simple, proven, multipurpose |
| Media | S3 + HLS | Scalable storage + adaptive streaming |
| Edge | Cloudflare | CDN + WAF + image resizing in one |
| Auth | OAuth2 + JWT | Standard, stateless, refresh rotation |

## 11. Scalability & Resilience

- Stateless API replicas behind a load balancer; scale on CPU/latency.
- PostgreSQL read replicas for read-heavy traffic; connection pooling (PgBouncer).
- CDN absorbs the majority of anonymous reads during breaking news.
- Circuit breakers/timeouts on external calls (payments, AI).
- Graceful degradation: if AI or search is down, core reading still works.
- Multi-AZ deployment; health checks + auto-restart; disaster-recovery runbook.

---

*Security controls for each boundary are detailed in `05-Security-Design.md`; data structures in `03-Database-Design.md`; the API contract in `04-API-Design.md`.*

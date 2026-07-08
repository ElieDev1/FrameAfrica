# Frame Africa — Delivery Plan & Progress Tracker

**Document:** 12 — Delivery Plan
**Version:** 1.0
**Status:** Living document — tick boxes as PRs merge into `dev`.
**Related:** `13-Product-Plan.md` (**how we build now** — roles, content model, complete workspaces, Definition of Done), `11-Roadmap.md` (milestones), `01-SRS.md` (requirements), `09-Git-Workflow.md` (branch/PR flow)

> **⚠ Approach reset (see `13-Product-Plan.md`).** We stop shipping thin slices and
> rebuild **complete workspaces** on a **real content model** and **real section
> taxonomy**, to a written **Definition of Done**. Build order now: (1) structured
> article + rich editor, (2) section/topic taxonomy, (3) media library, (4) editor
> desk, (5) live/developing stories, (6) the **Studio** (in-app flyers/social cards),
> then the remaining role workspaces. The slices below stay as the history/tracker.

---

## 1. Purpose

`11-Roadmap.md` says **why** and **when** at a milestone level. This document says
**what**, in build order, with a checkbox on every deliverable — the single place to
see what is done, in progress, and next. It decomposes each roadmap milestone into
**feature slices**, where a slice is roughly one `feature/*` branch and one PR.

## 2. How to use this document

- Each unchecked item is a slice or sub-task sized for one branch + PR
  (commit each logical change — see `09-Git-Workflow.md` §4.1).
- **Tick `[x]` when its PR merges into `dev`**, and add the PR number in `(#n)`.
- Build order is top-to-bottom: **dependencies first**. Reorder as priorities shift.
- Items trace to requirement IDs in `01-SRS.md` (e.g. `FR-AUTH-1`) and design docs.

**Legend:** `[x]` done · `[ ]` not started. In-review/partial items keep `[ ]`
until merged and note their PR.

## 3. Progress at a glance

| Phase | Milestone | Status |
|---|---|---|
| **Phase 0** | Foundation (v0.1) | ✅ Complete |
| **Phase 1** | MVP (v1.0) | 🚧 In progress |
| **Phase 2** | Growth (v1.5) | ⏳ Planned |
| **Phase 3** | Intelligence & Scale (v2.0) | ⏳ Planned |

---

## Phase 0 — Foundation (v0.1) ✅

- [x] Monorepo scaffold: pnpm + Turborepo, Prettier / ESLint / Husky, CI green (#3)
- [x] Next.js + NestJS skeletons; `/health`; global `/v1` prefix + strict `ValidationPipe`
- [x] Prisma base schema and enums — `user`, `role`, `category`, `article` (per `03`)
- [x] Local dev `docker-compose.yml` (PostgreSQL + Redis); `.gitattributes` (LF)
- [x] Docs set (`00`–`11`), Git workflow, community health files

---

## Phase 1 — MVP (v1.0) 🚧

**Goal:** publish and read news reliably in English + Kinyarwanda.

### Slice 1 — Public reading ✅ (#6)
- [x] Content read API: `GET /v1/articles`, `/articles/:slug`, `/categories` (`FR-READ-1`)
- [x] Standard `{ data, meta }` envelope + cursor pagination + category/language/text filters (`04`)
- [x] Published-only queries with no author PII leakage (`05` §4, §8)
- [x] Homepage (featured hero + Latest river) and article page `/article/[slug]` as Server Components
- [x] Typed web API client, idempotent dev seed, initial Prisma migration
- [x] Dark-mode design tokens (from scaffold)
- [x] Homepage upgraded to a magazine layout: hero + secondary headlines + **Most-read** sidebar (`sort=popular`) + newsletter teaser
- [x] Homepage blocks: **breaking-news ticker** + **per-section blocks** + **video/podcast strip** ("Watch & Listen"), plus sidebar widgets — **Editor's picks**, **Weather**, **Markets**, and labelled **Advertisement** slots (leaderboards + sidebar house ad) (`06` §4.1, `00` §4.2). _Weather/markets are static placeholders pending real feeds; ads are house ads pending the ad server (Slice 8)._
- [x] Article page depth: **Related stories** (`GET /v1/articles/:slug/related`) + a share bar — _comments, author bio, reading-progress still to come_

### Slice 2 — Sections & navigation 🚧
- [x] Section pages `/section/[slug]` with masthead + article river (`FR-READ-1`)
- [x] `GET /v1/categories/:slug` (section masthead); river via `GET /articles?category=`
- [x] Top-bar section nav + breadcrumbs (card/article kickers link to sections)
- [ ] Tags and tag pages — _deferred (needs a `tag` schema)_

### Slice 3 — Search 🚧
- [x] Search results UI + empty/"no results" state + header search box (`FR-READ-2`) — _interim keyword search over the API's Postgres `?q=` filter_
- [ ] OpenSearch index + reindex on publish, for relevance + typo tolerance (`02` §5)
- [ ] Dedicated `GET /v1/search` with filters + autocomplete

### Slice 4 — Auth & reader accounts  `FR-AUTH-*` 🚧
- [x] Login; JWT access + HTTP-only refresh cookie with rotation & reuse detection (`FR-AUTH-2`, `-7`; `05` §3)
- [x] RBAC guards (JwtAuthGuard + RolesGuard), deny-by-default; `GET /me` (`05` §4)
- [x] Reader-account **UI**: `/signup`, `/login`, `/account` + auth-aware header, via a BFF session (tokens in the Next server's HTTP-only cookies)
- [x] BFF session **refresh-on-expiry** (Next proxy rotates the access token) so logins survive past the access TTL — _refresh-lock for prefetch races is a follow-up_
- [x] Register + email verification (`FR-AUTH-1`) — verification link on register; `POST /auth/verify-email` stamps `emailVerifiedAt` (single-use, hashed, 24h token)
- [x] Password reset (`FR-AUTH-5`) — `POST /auth/password/forgot` (no enumeration) + `/auth/password/reset` (revokes all sessions); `/forgot-password` + `/reset-password` UI.
- [x] Real transactional email (SMTP via nodemailer, HTML templates) behind `MailerService`, with a console fallback in dev — verification, reset, and admin temp-password mails now deliver (WS12).
- [x] 2FA (TOTP) mandatory for staff (`FR-AUTH-6`) — native RFC 6238; `/account/security` enrol (QR + key), login code step, dashboard enforces enrolment for staff (WS12).
- [x] **Admin user management** — create/list users, assign/revoke roles, suspend/reactivate, reset passwords; generated first password + forced first-login reset (no email code), later resets emailed (WS8).
- [ ] Object-level authZ, applied per resource as write features land (`05` §4)
- [ ] Bookmarks, reading history, followed categories (`FR-READ-5`, `-6`) — _bookmarks live; history/follows pending_
- [ ] Data export + account erasure (`FR-AUTH-8`; `05` §9)

### Slice 5 — CMS & editorial workflow  `FR-PROD-*`, `FR-EDIT-*` 🚧
- [x] Journalist draft lifecycle: create/edit (author-scoped) + a tracked revision on every save + submit for review (`FR-PROD-1`, `-5`, `-6`), role-gated
- [x] Editor workflow: review queue + **publish/reject** (`ready` → `published`/`rejected`), editor-gated, with a `/cms/review` UI (`FR-EDIT-1`, `02` §6)
- [x] **Sub-editor copy desk** (WS14) — submitted drafts land on `copy_edit`; sub-editors polish then pass to editors (`ready`) or return to the writer (`/dashboard/copydesk`). Pipeline: draft → copy-edit → review → published.
- [x] Publish now / **schedule / embargo** + **archive** (`FR-EDIT-2`, `-3`, WS15) — schedule at a future time (holds `embargoed`; an in-process `SchedulerService` publishes when due); archive removes a published story from the public site.
- [x] **Admin full CRUD** (WS13) — create+publish/edit-any/publish/unpublish/archive/soft-delete→trash→restore for any article, plus taxonomy (sections/topics) CRUD (`/dashboard/articles`, `/dashboard/taxonomy`).
- [ ] Corrections & retractions with a public, dated log (`FR-EDIT-5`)
- [ ] Feature as breaking news (`FR-EDIT-4`)
- [x] CMS editor UI: `/cms` draft list + `/cms/new` + `/cms/[id]` editor (create/edit/submit), staff-gated (`06` §4.5) — _rich-text editor still a plain textarea for now_

### Slice 6 — Media  `FR-PROD-2` 🚧
- [ ] Signed S3 upload + responsive image variants (WebP/AVIF) (`02` §5)
- [x] Featured image on articles — `featured_image_url` on `article`, served by the read API and rendered with `next/image` across cards + article hero (falls back to the branded placeholder when absent). Staff attach one via the **CMS editor** (URL + alt + credit fields). _Galleries + upload still to come._
- [x] Credit / alt-text metadata — `featured_image_alt` + `featured_image_credit`, authored in the CMS and rendered as image `alt` and a photo credit (`06` §6). _Licensing field with the DAM._

### Slice 7 — Comments & moderation  `FR-COMM-*` 🚧
- [x] Threaded comments (`FR-COMM-1`) — `GET/POST /v1/articles/:id/comments`, one-level replies, a `comment` table with a moderation `status`, and a comment thread + form on the article page (signed-in readers; rate-limited 5/min).
- [x] Comment likes + reports (`FR-COMM-2`) — idempotent like/unlike + report endpoints, denormalised counts, like/report controls on each comment (WS7).
- [x] HTML sanitization to prevent stored XSS (`05` §6) — comment bodies are stored as plain text (markup stripped on write) and output-encoded by React on render.
- [x] Moderation queue, hide/remove, **delete**, **user ban** (`FR-COMM-3`, `-4`) — `/dashboard/moderation` for moderators/editors/admins: keep/hide/remove, delete a comment, and **ban/unban a user from commenting** (WS7, WS13, WS16). _AI spam pre-screen still to come._

### Slice 8 — Monetization  `FR-SUB-*`, `FR-AD-*`
- [ ] Metered paywall (N free/period) → `402` preview when over meter (`FR-SUB-1`; `04` §7)
  - *Partial, landed early as a Slice 1 fix (#8):* `GET /v1/articles/:slug` already
    returns the `402` + one-paragraph-preview shape for `isPremium` articles (every
    caller is currently treated as unsubscribed — there's no auth yet). Still
    missing: per-reader metering (N free articles/period), and this only covers
    the always-premium case, not "over the free meter."
- [ ] Plans, subscriptions, invoices (`FR-SUB-2`)
- [ ] MoMo & Airtel payments with signed, idempotent webhooks (`FR-SUB-3`; `05` §8)
- [ ] Basic ads + public notices / tenders / obituaries (`FR-AD-1`, `-3`)

### Slice 9 — Launch baseline
- [x] Global exception filter → standard `{ error: { code, ... } }` envelope (`04` §2) — pulled early so the whole API shares one error contract; the `402` premium preview stays success-shaped
- [x] SEO essentials: `NewsArticle` JSON-LD, XML sitemap, `robots.txt`, canonical URLs, OpenGraph + Twitter cards (`01` §4.8) — _Google News sitemap + `hreflang` still to come (the latter needs i18n routing)_
- [~] Admin overview + monitoring (`FR-ADM-3`) — `/dashboard/monitor` with user/article/comment stats + recent-activity feeds, and **edit-any-article** for admins regardless of author/status (WS10). _Event-level analytics ingestion still pending._
- [x] Admin integrations & API keys — `/dashboard/settings` to store integration keys (YouTube, AI, payments, custom) in an `app_setting` table, surfaced masked and read server-side (WS9).
- [ ] Backups + restore drill; pre-launch security checklist (`05` §16)
- [ ] i18n EN/RW at launch (`FR-READ-7`)

---

## Phase 2 — Growth (v1.5) ⏳

- [ ] PWA + offline reading; low-bandwidth data-saver mode (`FR-READ-8`, `-9`)
- [ ] Newsletters (digests) with delivery/open/click analytics (`FR-NEWS-*`)
- [ ] Push notifications (web + mobile) + breaking-news alerts (`FR-NOTIF-*`)
- [ ] Live blog / real-time tickers for elections & sports (`FR-LIVE-*`)
- [ ] Author profiles, related-articles engine, reading history
- [ ] Expanded analytics (funnels, churn, scroll depth) + A/B headline testing

---

## Phase 3 — Intelligence & Scale (v2.0) ⏳

- [ ] AI assistance: summaries, headline/tag suggestions, translation, TTS, recommendations (`FR-AI-*`)
- [ ] AI comment moderation + misinformation flagging (human-in-the-loop)
- [ ] Native Android & iOS apps
- [ ] Full multilingual (French, optional Kiswahili) with `hreflang`
- [ ] E-paper / PDF edition; open syndication API
- [ ] Hardening toward 99.99% uptime, higher concurrency, advanced observability

---

## 4. Current focus

> **Done so far (Phase 1):** Slice 1 public reading (#6); Slice 2 sections & nav
> (#14, tags deferred); Slice 3 interim Postgres search (#17, OpenSearch pending);
> Slice 4 auth core — login/JWT/refresh/RBAC + reader-account BFF UI (#11, #12);
> Slice 5 CMS — draft lifecycle + editor publish/reject + newsroom UI (#13, #16, #19);
> homepage depth — breaking ticker, section blocks, Most-read (#18, #22); article
> depth — related + share bar (#20); BFF session auto-refresh (#21). Slice 9's
> global exception filter landed early (#23); email verification + password
> reset (Slice 4 trust, `FR-AUTH-1`/`-5`). **Recent (WS7–WS12):** comment likes +
> reports + moderation queue (Slice 7 ✅); admin user management with a
> generated-password / forced first-login flow; admin integrations & API-key
> settings; admin monitoring + edit-any-article; a site-wide staff "Newsroom"
> nav; and **security & trust** — staff TOTP 2FA (mandatory for staff) + a real
> SMTP email transport. **Newsroom actors completed (WS13–WS16):** admin full
> CRUD (articles + taxonomy + comments); sub-editor **copy desk**; editor
> **schedule/embargo + archive**; moderator **user ban**. Every editorial office
> role — journalist, sub-editor, editor, moderator, admin — is now functionally
> complete (Ads Manager is the only office role still empty; it ships with ads).
>
> **Next up:** the (secondary) **reader experience** — follow section/topic/author
> + "For you", reading history, author pages, reading aids (progress/font/TTS).
> Then the remaining **critical infra** slices: **Slice 6** media on S3, **Slice 4**
> data export + erasure, **Slice 3** OpenSearch. **Slice 8 monetization** (paywall
> + MoMo/Airtel + ads, with the Ads Manager role) is deferred until the core is solid.

---

*Milestones and rationale live in `11-Roadmap.md`; requirements in `01-SRS.md`;
this document tracks execution. Keep it in sync as each PR merges.*

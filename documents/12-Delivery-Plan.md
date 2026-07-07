# Frame Africa — Delivery Plan & Progress Tracker

**Document:** 12 — Delivery Plan
**Version:** 1.0
**Status:** Living document — tick boxes as PRs merge into `dev`.
**Related:** `11-Roadmap.md` (milestones & rationale), `01-SRS.md` (requirements), `09-Git-Workflow.md` (branch/PR flow)

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

### Slice 2 — Sections & navigation 🚧
- [x] Section pages `/section/[slug]` with masthead + article river (`FR-READ-1`)
- [x] `GET /v1/categories/:slug` (section masthead); river via `GET /articles?category=`
- [x] Top-bar section nav + breadcrumbs (card/article kickers link to sections)
- [ ] Tags and tag pages — _deferred (needs a `tag` schema)_

### Slice 3 — Search
- [ ] OpenSearch index + reindex on publish (`FR-READ-2`, `02` §5)
- [ ] `GET /v1/search` with typo tolerance, filters, autocomplete
- [ ] Search results UI + empty/"no results" state

### Slice 4 — Auth & reader accounts  `FR-AUTH-*` 🚧
- [x] Login; JWT access + HTTP-only refresh cookie with rotation & reuse detection (`FR-AUTH-2`, `-7`; `05` §3)
- [x] RBAC guards (JwtAuthGuard + RolesGuard), deny-by-default; `GET /me` (`05` §4)
- [ ] Register + email verification (`FR-AUTH-1`) — _registration done; email verification pending_
- [ ] Password reset (`FR-AUTH-5`)
- [ ] 2FA (TOTP) mandatory for staff (`FR-AUTH-6`)
- [ ] Object-level authZ, applied per resource as write features land (`05` §4)
- [ ] Bookmarks, reading history, followed categories (`FR-READ-5`, `-6`)
- [ ] Data export + account erasure (`FR-AUTH-8`; `05` §9)

### Slice 5 — CMS & editorial workflow  `FR-PROD-*`, `FR-EDIT-*` 🚧
- [x] Journalist draft lifecycle: create/edit (author-scoped) + a tracked revision on every save + submit for review (`FR-PROD-1`, `-5`, `-6`), role-gated
- [ ] Editor workflow state machine: review → publish/reject, role-gated (`FR-EDIT-1`, `02` §6)
- [ ] Publish now / schedule / embargo (`FR-EDIT-2`, `-3`)
- [ ] Corrections & retractions with a public, dated log (`FR-EDIT-5`)
- [ ] Feature as breaking news (`FR-EDIT-4`)
- [ ] Distraction-free CMS editor UI (`06` §4.5)

### Slice 6 — Media  `FR-PROD-2`
- [ ] Signed S3 upload + responsive image variants (WebP/AVIF) (`02` §5)
- [ ] Featured image + galleries on articles
- [ ] Credit / alt-text / licensing metadata

### Slice 7 — Comments & moderation  `FR-COMM-*`
- [ ] Threaded comments, likes, reports (`FR-COMM-1`, `-2`)
- [ ] Rich-text/HTML sanitization to prevent stored XSS (`05` §6)
- [ ] Moderation queue, hide/remove, user ban; AI spam pre-screen hook (`FR-COMM-3`, `-4`)

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
- [ ] Global exception filter → standard `{ error: { code, ... } }` envelope (`04` §2)
- [ ] SEO: `NewsArticle` schema, XML + Google News sitemaps, OG/Twitter, `hreflang` (`01` §4.8)
- [ ] Analytics event ingestion + admin overview (`FR-ADM-3`)
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

> **Done:** Phase 1 · Slice 1 — Public reading (#6).
> **Next up:** _to be chosen_. Recommended: **Slice 4 — Auth & reader accounts**, which
> unblocks the most downstream MVP work (CMS, comments, paywall). Slices 2–3
> (sections, search) are smaller reader-facing alternatives if we want to finish the
> public read surface first.

---

*Milestones and rationale live in `11-Roadmap.md`; requirements in `01-SRS.md`;
this document tracks execution. Keep it in sync as each PR merges.*

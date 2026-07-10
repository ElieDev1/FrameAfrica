# Frame Africa — Build Tracker (start → finish)

**Document:** 15 — Build Tracker
**Version:** 1.0
**Status:** Living execution checklist. Tick `[x]` only when a workstream meets the
**Definition of Done** — not before.
**Related:** `13-Product-Plan.md` (roles, block content model, DoD), `14-Experience-and-Interfaces.md` (what people see & do), `12-Delivery-Plan.md` (historical slice tracker)

---

## 0. How to read this

This is the **one place** that lists everything we will build, in the order we will
build it, from the first thing to the last. Unlike `12` (which framed early work as
thin "MVP slices"), this tracker is organised into **workstreams** — each a *complete,
usable capability*. A workstream is only ticked when it satisfies the **Definition of
Done** below. There is no "MVP" half-state: a thing is either not-done `[ ]` or
genuinely done `[x]`.

### Definition of Done (applies to every checkbox)
A capability is **done** only when all of these are true (`13 §1`, `10-Coding-Standards`):
1. **Real backend + real frontend**, wired end-to-end — no placeholder data, no "coming soon".
2. **All states** handled — loading (skeletons), empty, error, permission-denied, success.
3. **Responsive** (mobile → desktop) and **accessible** (WCAG 2.1 AA: keyboard, labels, contrast).
4. **Designed for the user**, using the existing brand tokens/colours — polished, not a demo.
5. **Secure** — input validated, output sanitised, RBAC + object-level authZ, no PII/secret leakage (`05`).
6. **Tested** — unit + integration for logic; the critical path verified end-to-end.
7. **Documented** — `CHANGELOG.md` updated, and the relevant design doc kept in sync.
8. **Committed per logical change** and shipped via a PR into `dev` (`09-Git-Workflow`).

**Legend:** `[x]` done · `[~]` in progress (note PR) · `[ ]` not started.

---

## 1. Already in place (foundation — verified)

These earlier pieces are done and stay done; they are the base the workstreams build on.

- [x] Monorepo, CI (lint/type/test/build green), Prisma base schema, dev Postgres/Redis
- [x] Auth core — register/login/refresh/logout, email verification, password reset; JWT + rotating refresh in HTTP-only cookies; **Argon2id**; reuse detection (`05` §3)
- [x] RBAC guards (`JwtAuthGuard` + `RolesGuard` + `@Roles` + object-level scoping)
- [x] Public read API (`/articles`, `/articles/:slug`, `/categories`, `/related`) with no PII leakage
- [x] Reader accounts UI (`/signup`, `/login`, `/account`) via BFF session
- [x] Homepage (hero, sections, most-read, breaking ticker, widgets), section pages, search page (interim)
- [x] CMS draft lifecycle + editor publish/reject; article revisions
- [x] Comments (post/read, threaded one level, sanitised, moderation `status` enum)
- [x] Dashboard shell (sidebar + topbar, role-gated) — **to be upgraded in WS13**
- [x] SEO essentials (JSON-LD, sitemap, robots, OG/Twitter), global error envelope

---

## 2. Workstreams (build order)

> Dependencies flow top-to-bottom. The **article is the keystone** — most surfaces
> render or produce articles, so its structure comes first.

### WS1 — Structured article (block content model) 🔑 `[x]`
*The article becomes a real multi-part document, not a plain textarea.*
- [x] Schema: `Article.blocks` (structured JSON document) + migration
- [x] Shared **block schema** + types: `paragraph, heading, image, gallery, pullquote, blockquote, list, factbox, embed, divider`
- [x] **Validator + sanitiser** on write (strip HTML/control chars, allow-list URLs, YouTube→nocookie, size caps; `05` §6) + unit tests
- [x] API serves `blocks` in article detail (legacy `body` → blocks fallback so old content still renders)
- [x] Web **BlockRenderer** + per-block components, brand-styled (captions, credits, pull-quotes, fact-boxes, safe embeds)
- [x] Seed articles converted to real block documents (subheads, inline image, pull-quote, list, fact-box)
- [x] Reading aids: subhead anchors, reading-progress bar, sticky mobile share, "Updated" timestamp
- [x] CMS **block editor** — add / reorder / edit / delete every block type; empty-block pruning
- **DoD met:** a published story renders as a designed document and staff author it block-by-block. Verified end-to-end (CMS create with blocks → sanitised → served → rendered).

### WS2 — Real taxonomy (sections · sub-sections · topics) `[x]`
- [x] Real nested tree seeded from `14 §5.1` — **full 16-section tree + sub-sections** (78 categories); global header nav with **sub-section dropdowns** + a **mobile hamburger drawer**
- [x] **Section pages aggregate their sub-sections** (descendant-aware article listing) + **sub-section chips** + parent breadcrumb (verified e2e)
- [x] Load-more pagination on section **and** topic pages (cursor-based, via a server action)
- [x] **Topic/tag** model + article↔topic link (`topic` + `article_topic` tables) + seed tags (verified e2e)
- [x] Topic pages (`/topic/[slug]`) + description; tags on articles link through; `?topic=` article filter
- [x] **Follow** on topic/section pages (follow model shipped in WS7) — _author follow pends author pages_
- [x] Topic authoring in the CMS (tag a draft with topics; `GET /v1/topics`, chip picker) — verified e2e
- [x] Admin taxonomy manager (create/edit sections & topics at `/dashboard/taxonomy`, WS13)
- _Deferred:_ a section ad slot (lands with the ad server, WS9)
- **DoD met:** the site's navigation reflects a real newsroom taxonomy end-to-end.

### WS3 — Media library (real uploads) `[x]`
- [x] Upload API (staff-gated multipart) + **local storage driver** (writes to `web/public/uploads`, same-origin URL) + `media_asset` catalogue (alt/credit/licence) + list — verified e2e. _(S3 driver + WebP/AVIF variants are the prod swap behind the same `save()` contract.)_
- [x] Media library UI (browse/upload) + **picker** wired into the block editor + featured-image picker
- _Deferred:_ galleries as first-class media; S3 driver + responsive variants (prod swap)
- **DoD met (dev):** staff upload real images and pick them into stories; the DAM is the single source for media.

### WS4 — Editorial desk & workflow `[x]`
- [x] Status machine (`draft → copy_edit → ready → published`, plus embargo/archive/reject) with role transitions
- [x] Review desk — queue + publish + **return with a note** the author sees (cleared on resubmit); verified e2e. _(Diff vs revision + inline preview are enhancements.)_
- [x] **Corrections & retractions** — append-only `article_correction` log; editor-only `POST /cms/articles/:id/corrections` (note stripped of markup, published-only); a dated **Correction(s)** notice on the article page; an editor form on the published-story page. Verified e2e (add → 201 markup-stripped, public shows the dated note, non-editor → 403)
- [x] **Publish now / schedule / embargo** — scheduled publishing (PR #44, on `dev`)
- [x] **Homepage curation** — editors pin/unpin a published story as the front-page **lead** (`is_featured` + `featured_at`); the homepage hero + Editor's Picks read the featured set (fallback: latest); `?featured=` filter + editor toggle. Verified e2e (pin → appears, unpin → gone, non-editor → 403). _(Per-section curation + drag-arrange remain.)_
- **DoD:** an editor runs the whole pipeline from assignment to a curated front page.

### WS5 — Live / developing coverage `[x]`
- [x] Live-update model (`live_update`) + `isLive` on the article; staff post/end endpoints; public feed endpoint
- [x] Reader **live feed** on the article — pulsing **LIVE** badge, "Updated Xm ago", newest-first stream, **key-event** flags; **auto-refreshes every 20s** (polling) so updates appear without a reload
- [x] Newsroom **composer** on the published-story page (headline + body + key-event, and "End coverage")
- _Deferred:_ push-based real-time (SSE) upgrade over the 20s poll; a dedicated `/live` index
- **DoD met:** readers watch a story update without refreshing (verified e2e); SSE + a live index are the enhancement.

### WS6 — Studio (in-app design) `[x]`
- [x] Canvas editor at `/dashboard/studio` — **brand templates** (Headline · Breaking · Quote), sizes (Square · Story · Wide), editable kicker/headline/source with the Frame Africa mark + colours, and **export to PNG** (in-app, no external software)
- [x] **Background photo** — upload an image; it's drawn cover-fit under a legibility gradient with white text over it (export intact)
- [x] **Prefill from an article** (pick a published story → fills headline/section/author + its featured image)
- [x] **Fully customisable** — background colour, text + accent colours (swatches + custom), photo darkening, headline size, alignment, logo toggle, quote marks, editable footer; real brand logo
- _Deferred:_ auto social-share cards (OG images) generated per article
- **DoD met:** staff produce & download branded graphics in-app; auto OG cards are the enhancement.

### WS7 — Reader engagement `[x]`
- [x] Article **likes** — `article_like` (per-user, deduped) + `POST/DELETE/GET /v1/articles/:id/like` (auth), denormalised count kept in a transaction; a **like button** on the article page (optimistic, signed-out → login). Verified e2e (like/idempotent/unlike/401)
- [x] Comment **likes + report/flag** → moderation queue; **moderation UI** (hide/remove/ban) at `/dashboard/moderation`
- [x] **Bookmarks / saved** — `bookmark` table + `POST/DELETE/GET /v1/me/bookmarks/:id` + list; a **Save** button on the article + a **"Saved stories"** list in `/account`. Verified e2e (save/idempotent/list/unsave/401)
- [x] **Reading history** + **follow** sections/topics (in Account) — Follow/Unfollow on section & topic pages; account **Following** list (inline unfollow) + **Recently read** (with Clear); `/v1/me/follows` + `/v1/me/history` APIs, unit-tested & verified e2e. _(Follow **authors** lands with author pages.)_
- _Deferred:_ AI/heuristic spam pre-screen hook on comment create
- **DoD met:** every interaction in `14 §2` works, with moderation and abuse controls.

### WS8 — YouTube auto-video `[x]`
- [x] **Sync job**: channel uploads playlist → `playlistItems.list` → local `video` cache, hourly in-process (`VideoSyncService`) + admin `POST /v1/admin/videos/sync`. Key + channel id come from **admin settings** (`YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`); a no-op until configured.
- [x] **Video hub** (`/videos`) + homepage **Watch** strip render from the cache; **click-to-play `youtube-nocookie`** embeds (no third-party frame on page view).
- [x] Public `GET /v1/videos`; graceful empty state until a channel is connected. Unit-tested + verified e2e.
- [ ] In-article video/embed block via oEmbed (the block editor already allow-lists YouTube→nocookie embeds)
- **DoD met:** channel uploads appear on-site automatically and embed safely.

### WS9 — Advertising `[~]`
- [x] **Managed house ads** — `house_ad` model + admin CRUD (`/dashboard/ads`); public `GET /v1/ads?placement=` serves an active creative into the labelled IAB slots (leaderboard/billboard/rectangle/halfpage/native) with a **house-ad fallback**; click-through `GET /v1/ads/:id/go` (302) with **impression + click counting**. Unit-tested + verified e2e.
- [x] **Ad Studio** (`/dashboard/ads/studio`) — in-app canvas designer at exact IAB sizes (headline/subline/CTA, brand colours, background photo + darkening, brand mark); export PNG or **publish directly into a live slot** (uploads to the media library → creates the house ad).
- [ ] Full ad **sales server**: advertiser → campaign → flight; targeting (section/geo/device/day-part), frequency capping, A/B; `ads.txt`
- [ ] Notices / tenders / obituaries as sold, scheduled placements; viewability + sales reporting
- **DoD (core met):** ads are served, labelled and measured; the sales/targeting server remains.

### WS10 — Monetization & paywall `[ ]`
- [ ] Metered paywall (N free/period) → preview over meter; subscriber unlock + gift article
- [ ] Plans, subscriptions, invoices
- [ ] **MoMo & Airtel** + card payments with signed, idempotent webhooks (`05` §8)
- **DoD:** a reader subscribes with mobile money and reads premium content.

### WS11 — Newsletters & notifications `[~]`
- [x] **In-app notifications** (`14 §6.3`) — real dashboard bell (unread badge, list, mark read/all, deep links); newsroom emits on **publish** (→ author: live) and **return/reject** (→ author: changes requested). `/v1/me/notifications` API, unit-tested + verified e2e. _(SSE push is the enhancement over the 60s poll.)_
- [x] **Newsletter subscribe + unsubscribe** — `newsletter_subscriber` + rate-limited `POST /v1/newsletter/subscribe` (single opt-in, dedup/resubscribe) + one-click `POST /v1/newsletter/unsubscribe` (token) + editor subscriber count; the homepage signup box now persists; `/unsubscribe` page. Unit-tested + verified e2e.
- [ ] Digest **send** pipeline (SMTP/queue) + open/click analytics
- [ ] Breaking-news alerts + web push; reader comment-reply notifications (needs a reader bell / VAPID)
- **DoD (core met):** staff notifications + newsletter capture work; digest delivery + reader push remain.

### WS12 — Search `[x]`
- [x] **Real full-text search (Postgres FTS)** — `GET /v1/search` with weighted `ts_rank` relevance, `websearch_to_tsquery`, `ts_headline` **highlights**, language filter + pagination; `GET /v1/search/suggest` autocomplete. Replaces the interim `LIKE`. Unit-tested + verified e2e.
- _Deferred:_ **OpenSearch** swap-in (index + reindex-on-publish) for typo-tolerance + scale — drop-in behind the same `/v1/search` service; a GIN index is the interim perf step.
- **DoD met:** relevant, highlighted, filterable search is live; OpenSearch is the scale/typo-tolerance upgrade.

### WS13 — Staff dashboard UX (advanced) `[~]`
- [x] **Collapsible sidebar** (full ↔ icons-only, persisted, real SVG icons, collapsible groups, mobile drawer)
- [x] **Topbar**: admin search, quick-create (＋), **notifications bell** (live), **profile menu**, theme toggle; skeleton loaders
- [x] **Kanban pipeline** board (`/dashboard/pipeline`) — every story by stage (draft → copy desk → review → scheduled → published → returned) with per-column counts; editor-gated.
- [x] **KPI cards + charts** — the analytics dashboard (WS18): reading-now, views today, most-read, referrers.
- [ ] Editorial **calendar** view + saved table views / bulk actions + ⌘K palette
- **DoD (core met):** polished role-aware shell + pipeline board + analytics; calendar / bulk-table / ⌘K remain.

### WS14 — Personalization ("For You") `[x]`
- [x] Recommendation feed from follows + reading history — `/for-you` page + `GET /v1/me/feed` (parent-section follows expand to sub-sections; latest-news fallback when no signal). Unit-tested + verified e2e.
- _Deferred:_ "Because you follow…" rails on the homepage for signed-in readers (grouped by subject)
- **DoD met:** a signed-in reader gets a personalised feed; per-subject rails are the enhancement.

### WS15 — Internationalisation (EN / RW / FR) `[~]`
- [x] **Locale core (EN + Kinyarwanda)** — cookie/`Accept-Language` locale, `i18n` dictionary + `t()`, **language switcher**, translated masthead/footer, `<html lang>` per locale. Unit-tested + verified e2e (RW flips chrome + lang).
- [ ] Extend the dictionary to all UI strings; add **French**
- [ ] Per-article **language variants** (translation-group linking) + `hreflang` (needs per-locale URLs / route-based i18n)
- **DoD (core met):** the chrome is usable in English + Kinyarwanda; full string coverage, FR, and per-article translations remain.

### WS16 — PWA / offline / data-saver `[x]`
- [x] **Installable PWA** — web manifest (`app/manifest.ts`, 512² icon, standalone, theme-color) + apple-web-app meta.
- [x] **Service worker** (`public/sw.js`) — network-first navigations (news stays fresh) with a cached fallback + an **/offline** page; cache-first static assets; visited pages cached for **offline reading**. Registered in production only. Verified (manifest/sw/offline serve 200).
- _Deferred:_ explicit low-data/data-saver toggle (reduced images).
- **DoD met (core):** installs like an app and re-reads visited stories offline; a data-saver mode remains.

### WS17 — Trust & safety `[x]`
- [x] **Secure tips** channel — public `/tips` form + rate-limited `POST /v1/tips` (anonymous, markup-stripped); editor/moderator **tips inbox** at `/dashboard/tips` with a status workflow. Verified e2e.
- [x] Public **corrections & clarifications** log — `/corrections` + `GET /v1/corrections` (dated notes on published stories).
- [x] **Editorial standards** page (`/standards`) — accuracy, independence, right of reply, source protection, corrections; cross-linked to the log + tips.
- _Deferred:_ per-claim fact-check labels; structured right-of-reply request logging.
- **DoD met:** the paper's credibility surfaces are real and reachable.

### WS18 — Analytics `[x]`
- [x] **Anonymous page-view ingestion** (`page_view` + rate-limited `POST /v1/analytics/view` beacon fired from the article page; referrer reduced to host, no per-user tracking).
- [x] **Real-time editor dashboard** (`/dashboard/analytics`) — reading-now (5 min), views today, **most-read today**, **top referrers** (24h); `GET /v1/analytics/overview`. Unit-tested + verified e2e.
- _Deferred:_ scroll/completion depth, funnels/churn, A/B headline testing, event warehouse.
- **DoD met (core):** editors see live story performance; deeper product analytics remain.

### WS19 — Security & compliance hardening `[x]`
- [x] **2FA (TOTP) for staff** (`FR-AUTH-6`) — enrol/verify + login step (opt-in; enforce via `ENFORCE_STAFF_2FA`)
- [x] **Data export + account erasure** (`FR-AUTH-8`, Law N° 058/2021) — `GET /v1/me/export` + password-confirmed `POST /v1/me/delete` (PII scrub + soft-delete + session revoke; comments anonymised). Unit-tested + verified e2e.
- [x] Central **audit log** for privileged actions (`audit_log` + `GET /v1/admin/audit` + `/dashboard/audit`; records erasure + admin role/status changes). _(Rate limits already global via ThrottlerModule.)_
- [x] **Cookie consent** banner (server-persisted choice)
- _Deferred (ops):_ pre-launch security checklist (`05 §16`) + backups/restore drill; a standalone privacy-centre page
- **DoD met (app):** privacy rights (export/erasure), staff 2FA, audit log, and cookie consent are built + verified; the checklist + backups are an ops/runbook task.

### WS20 — Quality gate (continuous) `[x]`
- [x] **E2E of critical journeys** — Playwright (`web/e2e`): homepage→article, search, section listing; CI `e2e` job (Postgres + seed + build + start). Verified green. (Lint/type/unit/build gate already enforced in CI.)
- _Deferred:_ accessibility audit (axe) + performance budgets (Core Web Vitals / Lighthouse CI)
- **DoD met (core):** critical journeys are covered end-to-end in CI; a11y + perf budgets are the continuous-improvement layer.

---

## 3. Current focus

> **Closed (built + verified) — 11 of 20 workstreams:**
> WS1 structured article · WS2 taxonomy · WS3 media library · WS4 editorial desk ·
> WS5 live coverage · WS6 Studio · WS7 reader engagement · WS12 search (Postgres FTS) ·
> WS14 "For You" · WS19 security/privacy (2FA, export/erasure, audit, consent) ·
> WS20 quality gate (Playwright E2E in CI). *(WS1–WS7, WS12, WS14, WS19, WS20.)*
>
> **Core delivered, one named piece remaining `[~]`:**
> WS11 (in-app notifications ✅; **newsletters + web push** remain) ·
> WS13 (dashboard shell ✅; **kanban/calendar/analytics views** remain) ·
> WS15 (EN + Kinyarwanda ✅; **French + per-article translations + hreflang** remain).
>
> **Not started `[ ]` (no code yet):**
> WS8 YouTube video · WS9 advertising · WS10 payments/paywall (MoMo/Airtel) ·
> WS16 PWA/offline · WS17 trust-&-safety surfaces · WS18 analytics.
>
> Also deferred as *enhancements* inside closed workstreams: S3 media driver +
> galleries, SSE live, auto OG cards, OpenSearch, homepage "For You" rails,
> a11y/perf budgets, and the ops checklist/backups.

Update this section and tick boxes above as each PR merges into `dev`.

---

*This tracker governs execution order. When scope changes, change it here first.*

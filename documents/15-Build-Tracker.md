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

### WS2 — Real taxonomy (sections · sub-sections · topics) `[~]`
- [x] Real nested tree seeded from `14 §5` (5 sections × sub-sections; replaces the 6 placeholders)
- [x] **Section pages aggregate their sub-sections** (descendant-aware article listing) + **sub-section chips** + parent breadcrumb (verified e2e)
- [x] Load-more pagination on section **and** topic pages (cursor-based, via a server action)
- [ ] A section ad slot (lands with the ad server, WS9)
- [x] **Topic/tag** model + article↔topic link (`topic` + `article_topic` tables) + seed tags (verified e2e)
- [x] Topic pages (`/topic/[slug]`) + description; tags on articles link through; `?topic=` article filter
- [ ] **Follow** on topic/section/author pages (needs the follow model — WS7)
- [x] Topic authoring in the CMS (tag a draft with topics; `GET /v1/topics`, chip picker) — verified e2e
- [ ] Admin taxonomy manager (create/edit/reorder/activate sections & topics)
- **DoD:** the site's navigation reflects a real newsroom taxonomy end-to-end.

### WS3 — Media library (real uploads) `[~]`
- [x] Upload API (staff-gated multipart) + **local storage driver** (writes to `web/public/uploads`, same-origin URL) + `media_asset` catalogue (alt/credit/licence) + list — verified e2e. _(S3 driver + WebP/AVIF variants are the prod swap behind the same `save()` contract.)_
- [ ] Media library UI (browse/upload) + **picker** wired into the block editor + featured-image picker
- [ ] Galleries as first-class media; featured-image picker replaces URL-paste
- **DoD:** staff upload real images/galleries; the DAM is the single source for media.

### WS4 — Editorial desk & workflow `[~]`
- [ ] Full status machine (`draft→…→published`) with role transitions + assignments
- [ ] Review desk (queue, diff vs revision, approve/return with notes)
- [x] **Corrections & retractions** — append-only `article_correction` log; editor-only `POST /cms/articles/:id/corrections` (note stripped of markup, published-only); a dated **Correction(s)** notice on the article page; an editor form on the published-story page. Verified e2e (add → 201 markup-stripped, public shows the dated note, non-editor → 403)
- [x] **Publish now / schedule / embargo** — scheduled publishing (PR #44, on `dev`)
- [ ] **Homepage/section curation** (editor arranges lead + slots)
- **DoD:** an editor runs the whole pipeline from assignment to a curated front page.

### WS5 — Live / developing coverage `[ ]`
- [ ] Live-post model (entries under a story) + real-time delivery (SSE)
- [ ] Reader **Live page**: LIVE badge, "updated Xm ago", newest-first stream, key events
- [ ] Newsroom composer for posting live updates
- **DoD:** readers watch a story update in real time, CNN-style.

### WS6 — Studio (in-app design) `[ ]`
- [ ] Canvas editor for flyers / social cards / posters (brand templates, text, image, export PNG)
- [ ] Auto social-share cards (OG images) generated per article
- **DoD:** staff produce shareable graphics without external software.

### WS7 — Reader engagement (complete) `[ ]`
- [ ] Article **likes** + comment **likes** (per-user, de-duplicated)
- [ ] Comment **report/flag** → moderation queue; **moderation UI** (hide/remove/ban) + audit log
- [ ] **Bookmarks / saved**, **reading history**, **follow** sections/topics/authors (in Account)
- [ ] AI/heuristic spam pre-screen hook on comment create
- **DoD:** every interaction in `14 §2` works, with moderation and abuse controls.

### WS8 — YouTube auto-video `[ ]`
- [ ] Sync job: channel uploads playlist → `playlistItems.list` cache (no manual entry) (`14 §3.1`)
- [ ] Video hub + homepage "Watch" strip render from cache; `youtube-nocookie` embeds
- [ ] In-article video/embed block via oEmbed (allow-listed)
- **DoD:** channel uploads appear on-site automatically and embed safely.

### WS9 — Advanced advertising `[ ]`
- [ ] Ad server: advertiser → campaign → creative → flight; IAB unit slots; house-ad fallback
- [ ] Targeting (section/geo/device/day-part) + frequency capping + A/B; labels + `ads.txt`
- [ ] Notices / tenders / obituaries as sold, scheduled placements
- [ ] Impression/click/viewability tracking + sales reporting
- **DoD:** ads are sold, targeted, labelled, measured — per `14 §4`.

### WS10 — Monetization & paywall `[ ]`
- [ ] Metered paywall (N free/period) → preview over meter; subscriber unlock + gift article
- [ ] Plans, subscriptions, invoices
- [ ] **MoMo & Airtel** + card payments with signed, idempotent webhooks (`05` §8)
- **DoD:** a reader subscribes with mobile money and reads premium content.

### WS11 — Newsletters & notifications `[ ]`
- [ ] Newsletter subscribe + digests (delivery/open/click analytics), SMTP transport wired
- [ ] Breaking-news alerts + web push; **per-role in-app notifications** (`14 §6.3`) via SSE
- **DoD:** readers get newsletters/alerts; staff get real, role-relevant notifications.

### WS12 — Search (OpenSearch) `[ ]`
- [ ] OpenSearch index + reindex on publish; `GET /v1/search` with filters + autocomplete + highlights
- **DoD:** relevant, typo-tolerant, filterable search replaces the interim Postgres `LIKE`.

### WS13 — Staff dashboard UX (advanced) `[ ]`
- [ ] **Collapsible sidebar** (full ↔ icons-only, persisted, tooltips, mobile drawer)
- [ ] **Topbar**: global search / ⌘K palette, quick-create (＋), **notifications bell**, **profile menu**
- [ ] Advanced data display: tables (sort/filter/bulk/saved views), **kanban pipeline**, editorial **calendar**, KPI cards + charts, skeleton/empty/error states, toasts, confirm dialogs
- **DoD:** the back office is a polished, role-aware app per `14 §6`.

### WS14 — Personalization ("For You") `[ ]`
- [ ] Recommendation feed from follows + reading history; "Because you follow…" rails
- **DoD:** a signed-in reader gets a genuinely personalised home.

### WS15 — Internationalisation (EN / RW / FR) `[ ]`
- [ ] Locale routing + UI strings + per-article language variants + `hreflang` + language switcher
- **DoD:** the product is usable in English, Kinyarwanda, and French.

### WS16 — PWA / offline / data-saver `[ ]`
- [ ] Installable PWA, offline saved-article reading, low-data mode
- **DoD:** works on low-bandwidth African connections and installs like an app.

### WS17 — Trust & safety `[ ]`
- [ ] Corrections page, fact-check labels, right-of-reply logging, **secure tips** channel, editorial standards
- **DoD:** the paper's credibility surfaces are real and reachable.

### WS18 — Analytics `[ ]`
- [ ] Event ingestion + **real-time editor analytics** (who's-reading-now, referrers, scroll/completion) + admin dashboards
- **DoD:** editors see live performance; admins see the business.

### WS19 — Security & compliance hardening `[ ]`
- [ ] **2FA (TOTP) mandatory for staff** (`FR-AUTH-6`)
- [ ] Central **audit log** for privileged actions; rate limits on all mutations
- [ ] Cookie consent + privacy centre; **data export + account erasure** (`FR-AUTH-8`, Law N° 058/2021)
- [ ] Pre-launch security checklist (`05 §16`), backups + restore drill
- **DoD:** the platform passes the security checklist and privacy obligations.

### WS20 — Quality gate (continuous) `[ ]`
- [ ] E2E coverage of critical journeys; accessibility audit; performance budgets (Core Web Vitals)
- **DoD:** green quality gate on every release.

---

## 3. Current focus

> **Done:** **WS1 — Structured article** ✅, **WS2 — Real taxonomy** ✅
> (nested sections + topics + CMS authoring + load-more), and **WS3 — Media
> library** ✅ (uploads + storage driver + library UI + editor/featured picker).
> **Now:** **WS4 — Editorial desk & workflow** (schedule/embargo, corrections,
> review desk, homepage curation).
> **Next:** WS5 live coverage, then WS6 Studio.

Update this section and tick boxes above as each PR merges into `dev`.

---

*This tracker governs execution order. When scope changes, change it here first.*

# Changelog

All notable changes to **Frame Africa** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **How this file is maintained**
> - Add every notable change under **[Unreleased]** as you merge PRs into `dev`.
> - Group entries under: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
> - When `dev` is merged to `main` and tagged, move `[Unreleased]` items into a new versioned section with the date.
> - Entry style mirrors Conventional Commits, e.g. `feat(articles): scheduled publishing`.

---

## [Unreleased]

### Added
- **Homepage furniture (design build-out):** the homepage now carries the remaining blocks from `06 §4.1` / `00 §4.2` — a **video/podcast strip** ("Watch & Listen", horizontal scroll), plus sidebar widgets for **Editor's picks**, **Weather** (key African cities), and **Markets** (FX + indices), and clearly-labelled **Advertisement** slots (leaderboard banners + a sidebar house ad, visually distinct from editorial per `06 §4.1`). Weather/markets show representative static data pending real feeds; the ad slots are house ads until the ad server (Slice 8) lands.
- **Comments (Slice 7, first increment):** readers can comment on articles. `GET /v1/articles/:id/comments` (public, visible-only, threaded one level) and `POST` (signed-in, rate-limited 5/min) backed by a new `comment` table with a moderation `status` (visible/pending/hidden/removed). Bodies are stored as **plain text — HTML is stripped on write** so no markup/script can be persisted (`05` §6), and React output-encodes on render. The article page gains a **comment thread + form** (or a sign-in prompt), with a couple of seeded comments. Likes/reports and the moderation queue are follow-ups.
- **CMS featured-image authoring (Slice 6):** journalists can attach a featured image to a draft from the CMS editor — an **image URL, alt text, and credit** on create and edit — completing the featured-image slice on the write side. (Signed S3 upload + galleries remain follow-ups; the field accepts any URL today.)
- **SEO essentials (Slice 9):** `NewsArticle` JSON-LD structured data on article pages, a dynamic XML **sitemap** (home + sections + published articles) and **`robots.txt`** (private surfaces disallowed), **canonical URLs**, and **OpenGraph + Twitter card** metadata site-wide and per article/section — with a shared title template and `metadataBase` (`01` §4.8). Google News sitemap and `hreflang` remain follow-ups (the latter needs i18n routing).
- **Featured images on articles (Slice 6, first increment):** articles now carry a `featured_image_url` plus `featured_image_alt` and `featured_image_credit` (`06` §6). The read API serves them, and the web app renders real images with `next/image` across article cards and the article hero (with a photo credit), falling back to the branded aperture placeholder when a story has none. Seed articles ship with bundled cover art under `/public/seed`. Signed S3 upload + galleries + CMS image authoring are the follow-up increments.
- **Brand-accurate premium redesign (web):** the real Frame Africa logo (Africa + camera-aperture mark, "Frame Africa" wordmark, "NEWS. VIEWS. AFRICA." tagline) now anchors the header and footer, with a light-background variant that swaps by theme, plus generated favicon/app icons from the brand mark. Adds a **light/dark theme toggle** (resolved before paint from stored choice → system preference, so no flash). Elevates the reader surface: larger editorial headline scale, a lede treatment, deliberate branded media panels (an aperture motif) in place of blank gradients, hover polish on cards, and a refined header (search pill, glowing Subscribe CTA). (`06`)
- **Email verification + password reset (MVP):** `POST /v1/auth/verify-email`, `/auth/password/forgot`, and `/auth/password/reset` (`FR-AUTH-1`, `-5`; `04` §4). Registration now emails a verification link; verifying stamps `emailVerifiedAt`. Reset tokens and verification tokens are **single-use, hashed at rest, and short-lived** (`05` §3.1) via a new `user_token` table; `forgot` always responds the same whether or not the email exists (no account enumeration, `05` §3.4); a completed reset **revokes every active session**. A `MailerService` logs the link for now (SMTP transport still to wire — `00` §8). Web pages: `/forgot-password`, `/reset-password`, `/verify-email`, plus a "Forgot your password?" link on `/login`.
- Initial system analysis & design documentation set (`documents/00`–`09`).
- Git & GitHub workflow, `CONTRIBUTING.md`, `.gitignore`, PR template.
- Community health files: `SECURITY.md`, `CODE_OF_CONDUCT.md`, `LICENSE`, `CODEOWNERS`, issue templates.
- Coding standards, product roadmap, and Architecture Decision Records (ADRs).
- CI workflow and `.env.example`.
- Interactive UI/UX design prototype (`documents/design-prototype/`) covering Homepage, Article, Category, Search, CMS Editor, Admin, and Components screens.
- **Phase 0 scaffold:** pnpm + Turborepo monorepo with the Next.js web app (`projects/web`) and NestJS API (`projects/api`).
- Prisma base schema and enums (`user`, `role`, `category`, `article`) per `03-Database-Design.md`.
- API baseline: global `/v1` prefix, strict `ValidationPipe`, `PrismaModule`, and a `/health` endpoint.
- Web baseline: brand fonts (Archivo, Source Serif 4, IBM Plex Mono), dark/light design tokens, and the landing page.
- Local dev `docker-compose.yml` (PostgreSQL + Redis) and `.gitattributes` to enforce LF line endings.
- **Phase 1 — public reading (MVP):** content module with public read endpoints `GET /v1/articles`, `GET /v1/articles/:slug`, and `GET /v1/categories`, returning the standard `{ data, meta }` envelope with cursor pagination and category/language/text filters.
- Published-only queries that expose no author PII (password hash, 2FA secret, email, phone), backed by unit tests.
- Next.js homepage (featured hero + Latest river) and article page (`/article/[slug]`) wired to the API as Server Components, with `ArticleCard`, a shared header/footer, SEO metadata, and graceful states for unreachable-API / 404.
- Typed web API client, an idempotent dev seed (`pnpm db:seed`), and the initial Prisma migration.
- `12-Delivery-Plan.md`: a living, checkboxed progress tracker that decomposes the roadmap into feature slices (traced to SRS requirement IDs).
- **Auth core (MVP):** `POST /v1/auth/register|login|refresh|logout` and `GET /v1/me`, issuing a short-lived access JWT plus a rotating refresh token; new readers get the `reader` role. RBAC building blocks (`JwtAuthGuard`, `RolesGuard`, `@Roles`, `@CurrentUser`) and a `refresh_token` table/migration.
- **CMS drafts (MVP):** staff-only draft lifecycle under `/v1/cms/articles` — create, list-own, get, update, and submit-for-review — gated by `JwtAuthGuard` + `RolesGuard` with per-author object-level scoping. Every save snapshots an `ArticleRevision` (new table/migration); titles auto-slug uniquely. First consumer of the RBAC layer.
- **Sections & navigation (MVP):** `GET /v1/categories/:slug` (section masthead) plus a Next.js section page `/section/[slug]` (masthead + article river, SEO, 404). The site header now shows top-level section nav, and article-card kickers / article breadcrumbs link through to their section.
- **Design alignment:** header and footer now match `documents/design-prototype` — aperture logo + FRAMEAFRICA wordmark (shared `Wordmark`), sticky header, and a 4-column footer (Sections/Company/Products/Legal) with tagline, legal line, and EN/RW/Français switcher.
- **Reader accounts UI (MVP):** `/signup`, `/login`, and `/account` pages plus an auth-aware header, backed by a **BFF session** — the Next server holds tokens in HTTP-only cookies (`fa_access`/`fa_refresh`) and the browser never sees them (`05` §3.2, §7).
- **CMS newsroom UI (MVP):** staff-gated `/cms` (draft list with status badges), `/cms/new`, and `/cms/[id]` editor — create, edit, and submit-for-review a draft in the browser, backed by the BFF-authenticated CMS client. Reached via the header **Write** link.
- **Search (MVP):** a `/search` page (results / empty / no-results) plus a header search box, running an interim keyword search over the API's `?q=` filter. OpenSearch-backed relevance and typo tolerance remain a follow-up.
- **Article depth:** `GET /v1/articles/:slug/related` (up to 4 same-category stories) drives a **Related stories** block on the article page, plus a client **share bar** (X / Facebook / WhatsApp / copy-link).
- **Editor workflow (MVP):** editor-gated `GET /v1/cms/review` + `POST /cms/articles/:id/publish|reject` and a `/cms/review` UI — submitted (`ready`) drafts can be **published** (→ live) or **rejected**. Seeds an editor account.
- **Homepage blocks:** a full-width **breaking-news ticker** and **per-section blocks** (top sections, a few cards each).
- **Global exception filter (API):** every unhandled error now returns the standard `{ error: { code, message, details?, requestId } }` envelope (`04-API-Design.md` §2), with status→code mapping (`NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `CONFLICT`, `RATE_LIMITED`, `PAYMENT_REQUIRED`, `INTERNAL_ERROR`). The `ValidationPipe` now emits per-field `details` (`{ field, issue }`); 5xx errors are logged server-side but reported generically so no internal detail leaks (`05` §8). The `402` premium preview stays success-shaped.

### Changed
- **Staff now use a dedicated dashboard, separate from the reader site.** The newsroom moved from `/cms` to `/dashboard` — a sidebar + topbar shell with role-aware navigation (Overview / My stories / New story; **Review queue** for editors; **Users & roles / Settings** for admins), a role-aware overview with real counts, and a "View site" / sign-out topbar. The public header/footer are hidden on `/dashboard` (via an `x-pathname` header from the proxy); admin sections are gated by a new `requireAdmin`. Addresses the coding-standards intent of separate `(cms)`/`(admin)` surfaces (`10 §2`, `06 §4.5`–§4.6).
- Reconciled `12-Delivery-Plan.md` §4 "Current focus" with what has actually merged (Slices 1–5 + homepage/article depth), replacing the stale "Slice 1 done / next up to be chosen" note.
- `06-UIUX-Content-Layout.md`: locked in concrete font families (Archivo, Source Serif 4, IBM Plex Mono) matching the design prototype; added a link to the prototype.
- Scoped Prettier to code (`projects/**` + config); hand-authored docs (`*.md`, `documents/`) are excluded from formatting.
- Aligned Jest to v29 across `web` and `api` so a single test-runner version is used monorepo-wide.
- `09-Git-Workflow.md`: added a **Commit Granularity** policy (§4.1) — commit after each logical change, not once per phase.
- Refreshed stale status markers in `11-Roadmap.md` and `CLAUDE.md` (Phase 0 done, MVP in progress) and linked the delivery plan from the docs index.
- BFF sessions now **refresh on expiry**: a Next proxy rotates the access token (using the stored refresh cookie) when it expires, so logins survive past the ~15-minute access TTL instead of silently signing out.

### Fixed
- CI is now green end-to-end (format, lint, type-check, test, build): the API generates the Prisma client on `postinstall`, resolving type-unsafe `PrismaClient` lint errors, and the Jest version mismatch that crashed the API test suite is gone.

### Deprecated
- _Nothing yet._

### Removed
- _Nothing yet._

### Security
- Established security design baseline (`documents/05-Security-Design.md`) and vulnerability-reporting policy (`SECURITY.md`).
- `GET /v1/articles/:slug` no longer leaks the full body of premium (`isPremium`) articles to unsubscribed callers: it now returns a one-paragraph preview with `isLocked: true` and HTTP `402`, per `04-API-Design.md` §7.
- Passwords hashed with **Argon2id**; refresh tokens stored **hashed** and delivered in an **httpOnly, SameSite=strict** cookie with **rotation + reuse detection** (replaying a rotated token revokes the whole token family), per `05-Security-Design.md` §3.

---

## [0.1.0] - 2026-07-06

### Added
- Project inception: repository structure, brand identity, and documentation foundation.

---

<!--
Template for a new release section:

## [X.Y.Z] - YYYY-MM-DD
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
-->

[Unreleased]: https://github.com/<org>/frame-africa/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/<org>/frame-africa/releases/tag/v0.1.0

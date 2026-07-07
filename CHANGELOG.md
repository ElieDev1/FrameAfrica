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

### Changed
- `06-UIUX-Content-Layout.md`: locked in concrete font families (Archivo, Source Serif 4, IBM Plex Mono) matching the design prototype; added a link to the prototype.
- Scoped Prettier to code (`projects/**` + config); hand-authored docs (`*.md`, `documents/`) are excluded from formatting.
- Aligned Jest to v29 across `web` and `api` so a single test-runner version is used monorepo-wide.
- `09-Git-Workflow.md`: added a **Commit Granularity** policy (§4.1) — commit after each logical change, not once per phase.
- Refreshed stale status markers in `11-Roadmap.md` and `CLAUDE.md` (Phase 0 done, MVP in progress) and linked the delivery plan from the docs index.

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

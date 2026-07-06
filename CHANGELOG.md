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

### Changed
- `06-UIUX-Content-Layout.md`: locked in concrete font families (Archivo, Source Serif 4, IBM Plex Mono) matching the design prototype; added a link to the prototype.
- Scoped Prettier to code (`projects/**` + config); hand-authored docs (`*.md`, `documents/`) are excluded from formatting.
- Aligned Jest to v29 across `web` and `api` so a single test-runner version is used monorepo-wide.
- `09-Git-Workflow.md`: added a **Commit Granularity** policy (§4.1) — commit after each logical change, not once per phase.

### Fixed
- CI is now green end-to-end (format, lint, type-check, test, build): the API generates the Prisma client on `postinstall`, resolving type-unsafe `PrismaClient` lint errors, and the Jest version mismatch that crashed the API test suite is gone.

### Deprecated
- _Nothing yet._

### Removed
- _Nothing yet._

### Security
- Established security design baseline (`documents/05-Security-Design.md`) and vulnerability-reporting policy (`SECURITY.md`).

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

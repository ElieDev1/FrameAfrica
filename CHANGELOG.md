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

### Changed
- `06-UIUX-Content-Layout.md`: locked in concrete font families (Archivo, Source Serif 4, IBM Plex Mono) matching the design prototype; added a link to the prototype.

### Deprecated
- _Nothing yet._

### Removed
- _Nothing yet._

### Fixed
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

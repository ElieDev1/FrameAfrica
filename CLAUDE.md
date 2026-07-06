# CLAUDE.md — Frame Africa

> Claude Code reads this file automatically. It is the fast on-ramp to the project.

## What this is
**Frame Africa** — a modern, AI-assisted digital newspaper platform for Rwanda & Africa.
Tagline: *NEWS. VIEWS. AFRICA.* Built with **Next.js** (frontend) + **Node.js / NestJS** (backend).

## Read these first (in order)
All design docs live in `documents/`:
1. `documents/00-System-Overview.md` — the big picture & brand
2. `documents/01-SRS.md` — requirements (functional + non-functional)
3. `documents/02-System-Architecture.md` — how it's built (Next.js + NestJS)
4. `documents/03-Database-Design.md` — schema & data model (PostgreSQL)
5. `documents/04-API-Design.md` — REST API contract
6. `documents/05-Security-Design.md` — **security is a hard requirement, read fully**
7. `documents/06-UIUX-Content-Layout.md` — layouts & design tokens
8. `documents/07-Use-Cases.md` — actor flows
9. `documents/08-Test-Deployment.md` — testing & CI/CD
10. `documents/09-Git-Workflow.md` — branching & PR rules (follow strictly)
11. `documents/10-Coding-Standards.md` — conventions & Definition of Done
12. `documents/11-Roadmap.md` — what to build next (start at Phase 0 → 1)
13. `documents/adr/` — architecture decisions

## Tech stack
Next.js (React, TS) · NestJS (Node, TS) · PostgreSQL · OpenSearch · Redis · S3 · Cloudflare ·
OAuth2+JWT · MoMo/Airtel/card payments · Docker/K8s · GitHub Actions.

## Where code goes
- `projects/web/` — Next.js app (currently empty — to scaffold)
- `projects/api/` — NestJS app (currently empty — to scaffold)
- `documents/` — docs (source of truth; update when behavior changes)

## Rules Claude Code must follow
- **Branching:** never commit to `main` or `dev`. Branch every feature off `dev` as
  `feature/<name>`, open a PR into `dev`. See `documents/09-Git-Workflow.md`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`…), one logical change each.
- **Language:** TypeScript, `strict`. Follow `documents/10-Coding-Standards.md`.
- **Security:** apply `documents/05-Security-Design.md` — validate input, no secrets in client,
  parameterized queries, RBAC + object-level authZ, tokens in HTTP-only cookies.
- **Tests:** every feature ships with tests (see `documents/08-Test-Deployment.md`).
- **Changelog:** add an entry under `[Unreleased]` in `CHANGELOG.md` with each change.
- **Don't** commit `.env`, `node_modules`, or build output (see `.gitignore`).

## Current status
Documentation complete. Code not yet scaffolded — the next step is Phase 0 in
`documents/11-Roadmap.md`: initialize the Next.js and NestJS skeletons in `projects/`,
set up the base database schema, and get CI green.

## How to start a work session
1. Read the docs above (skim 00, then the ones relevant to the task).
2. Confirm the task and which roadmap phase it belongs to.
3. Create a `feature/*` branch off `dev`.
4. Implement + test + update docs/CHANGELOG.
5. Open a PR into `dev`.

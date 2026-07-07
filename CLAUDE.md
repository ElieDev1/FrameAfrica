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
12. `documents/11-Roadmap.md` — milestones (why/when)
13. `documents/12-Delivery-Plan.md` — **live progress tracker (what's done / next), checkboxed**
14. `documents/13-Product-Plan.md` — **how we build now: roles, block-based content model, Definition of Done** (via PR #31)
15. `documents/14-Experience-and-Interfaces.md` — **what visitors see & do, YouTube video, advanced ads, taxonomy, staff dashboard UX**
16. `documents/15-Build-Tracker.md` — **the single start→finish build checklist (workstreams + Definition of Done)**
17. `documents/adr/` — architecture decisions

## Tech stack
Next.js (React, TS) · NestJS (Node, TS) · PostgreSQL · OpenSearch · Redis · S3 · Cloudflare ·
OAuth2+JWT · MoMo/Airtel/card payments · Docker/K8s · GitHub Actions.

## Where code goes
- `projects/web/` — Next.js app (scaffolded; homepage + article page live)
- `projects/api/` — NestJS app (scaffolded; content read API live)
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
**Phase 0 complete** (monorepo, Next.js + NestJS skeletons, base schema, CI green).
**Phase 1 (MVP) in progress** — the public reading slice is live (content read API +
homepage + article page). See `documents/12-Delivery-Plan.md` for the checkboxed
plan and what's next (recommended: auth & reader accounts).

## How to start a work session
1. Read the docs above (skim 00, then the ones relevant to the task).
2. Confirm the task and which roadmap phase it belongs to.
3. Create a `feature/*` branch off `dev`.
4. Implement + test + update docs/CHANGELOG.
5. Open a PR into `dev`.

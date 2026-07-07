# Frame Africa

> **NEWS. VIEWS. AFRICA.** — A modern, AI-assisted digital newspaper platform for Rwanda and Africa.
> Built with **Next.js** (frontend) and **Node.js** (backend).

## Repository structure

```
FrameAfrica/
├── README.md                     ← you are here (project index)
├── CHANGELOG.md                  ← notable changes per release (Keep a Changelog)
├── CONTRIBUTING.md               ← short contributor guide
├── CODE_OF_CONDUCT.md            ← community standards
├── SECURITY.md                   ← how to report vulnerabilities
├── LICENSE                       ← proprietary license notice
├── .gitignore                    ← ignored files (node_modules, .env, builds)
├── .env.example                  ← environment-variable template
├── .github/
│   ├── CODEOWNERS                    auto review assignment
│   ├── pull_request_template.md
│   ├── ISSUE_TEMPLATE/               bug_report.md · feature_request.md
│   └── workflows/ci.yml              CI: lint, type-check, test, security
├── documents/                    ← system analysis & design documents (.md)
│   ├── 00-System-Overview.md         High-level system description & brand
│   ├── 01-SRS.md                     Software Requirements Specification
│   ├── 02-System-Architecture.md     Architecture & technology design
│   ├── 03-Database-Design.md         ER model, schema, data dictionary
│   ├── 04-API-Design.md              REST API specification
│   ├── 05-Security-Design.md         Threat model & security controls
│   ├── 06-UIUX-Content-Layout.md     Information architecture & page layouts
│   ├── 07-Use-Cases.md               Use cases, user stories & data flows
│   ├── 08-Test-Deployment.md         Test plan & deployment / DevOps
│   ├── 09-Git-Workflow.md            Git & GitHub branching / PR workflow
│   ├── 10-Coding-Standards.md        Coding conventions & Definition of Done
│   ├── 11-Roadmap.md                 Product roadmap & milestones
│   ├── 12-Delivery-Plan.md           Live progress tracker (checkboxed slices)
│   ├── 13-Product-Plan.md            Build approach: roles, block-based content model, Definition of Done
│   ├── 14-Experience-and-Interfaces.md  Visitor surfaces, engagement, YouTube video, ads, taxonomy, dashboard UX
│   └── adr/                          Architecture Decision Records
├── projects/                     ← Next.js (web) + NestJS (api) codebase
└── assets/                       ← brand assets (logo, icons)
```

## Reading order

1. **00 — System Overview** — what Frame Africa is, the brand, and the big picture.
2. **01 — SRS** — the full requirements (functional + non-functional).
3. **02 — Architecture** — how the system is built with Next.js + Node.js.
4. **03 — Database Design** — the data model and schema.
5. **04 — API Design** — the contract between frontend and backend.
6. **05 — Security Design** — how the system is protected (read alongside every doc).
7. **06 — UI/UX & Content Layout** — how the product looks and is organized.
8. **07 — Use Cases** — how actors interact with the system.
9. **08 — Test & Deployment** — how it's verified and shipped.
10. **09 — Git Workflow** — branching, PRs, and release process.
11. **10 — Coding Standards** — conventions and Definition of Done.
12. **11 — Roadmap** — milestones from MVP to scale.
13. **12 — Delivery Plan** — live, checkboxed progress tracker (what's done / next).
14. **13 — Product Plan** — how we build now: roles, block-based content model, Definition of Done.
15. **14 — Experience & Interfaces** — what visitors see & do, YouTube video, advanced ads, taxonomy, staff dashboard UX.
16. **adr/** — the record of key architecture decisions.

## Tech stack (summary)

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) + TypeScript |
| Backend | Node.js (NestJS) + TypeScript |
| Database | PostgreSQL |
| Search | OpenSearch / Elasticsearch |
| Cache | Redis |
| Media | S3-compatible object storage |
| CDN / Edge security | Cloudflare |
| Auth | OAuth 2.0 + JWT (access + refresh) |
| Payments | MTN MoMo · Airtel Money · cards |
| Infra | Docker · Kubernetes · GitHub Actions |
| Observability | Prometheus · Grafana · OpenTelemetry |

## Status

Documentation phase. Code lives in `projects/` once development begins.

---
*Prepared for planning, academic submission, and development reference.*

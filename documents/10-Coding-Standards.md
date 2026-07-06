# Frame Africa — Coding Standards

**Document:** 10 — Coding Standards
**Version:** 1.0
**Applies to:** all code in `projects/` (Next.js frontend, Node.js/NestJS backend).

---

## 1. Languages & Tooling

- **Language:** TypeScript everywhere (frontend and backend). `strict` mode on.
- **Package manager:** pnpm (or npm — pick one and commit the lockfile).
- **Formatter:** Prettier (single source of truth for style — never argue formatting).
- **Linter:** ESLint (with `@typescript-eslint`, `eslint-config-next`, and security plugins).
- **Commit hooks:** Husky + lint-staged run format, lint, and type-check pre-commit.
- **Editor:** shared `.editorconfig`; VS Code settings committed under `.vscode/` (formatter on save).

## 2. Project Structure (target)

```
projects/
├── web/                  # Next.js app
│   ├── app/              # App Router (route groups: (public) (reader) (cms) (admin))
│   ├── components/       # Reusable UI (design-system components)
│   ├── lib/              # Client/server helpers, API client
│   ├── hooks/            # React hooks
│   ├── styles/           # Tailwind + tokens
│   └── tests/
└── api/                  # NestJS app
    ├── src/
    │   ├── modules/      # auth, users, content, comments, billing, ...
    │   │   └── <module>/ # controller, service, repository, dto, entities
    │   ├── common/       # guards, interceptors, filters, pipes
    │   ├── config/
    │   └── main.ts
    └── test/
```

## 3. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files (TS/React components) | PascalCase for components, kebab-case for others | `ArticleCard.tsx`, `article.service.ts` |
| Variables & functions | camelCase | `getArticleBySlug` |
| Types & interfaces | PascalCase | `Article`, `CreateArticleDto` |
| Constants / enums values | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE` |
| React components | PascalCase | `<PaywallPrompt />` |
| Booleans | is/has/can prefix | `isPublished`, `canEdit` |
| DB tables/columns | snake_case | `article`, `published_at` |
| API routes | kebab-case, plural nouns | `/cms/articles` |

## 4. TypeScript Rules

- No `any` — use precise types, generics, or `unknown` + narrowing.
- Prefer `type`/`interface` over inline shapes for shared data.
- Validate all external input with DTOs (class-validator) / zod schemas; never trust the client.
- No non-null assertions (`!`) except with a justifying comment.
- Handle every promise (`no-floating-promises`); use `async/await`, not raw `.then` chains.
- Model errors explicitly; don't swallow exceptions.

## 5. Frontend (Next.js/React) Rules

- Default to **Server Components**; add `"use client"` only when interactivity requires it.
- Keep components small and single-purpose; lift shared UI into the design system.
- Data fetching on the server where possible; use the BFF pattern for sensitive calls.
- No secrets in client code — only `NEXT_PUBLIC_*` values are public.
- Accessibility is required, not optional: semantic HTML, labels, focus, alt text (see `06`).
- Style with Tailwind + design tokens; no hard-coded hex values outside the token file.
- Images via `next/image`; avoid layout shift; lazy-load below the fold.

## 6. Backend (Node.js/NestJS) Rules

- One responsibility per module; controllers stay thin, logic lives in services.
- All input validated by a global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`).
- Access DB through the repository/ORM layer — **never** build raw SQL strings.
- Guards enforce authN/authZ on every protected route (see `05`); deny by default.
- Return the standard response/error envelope (see `04`); never leak stack traces.
- Long-running work goes to the queue (BullMQ), not the request thread.
- Log with structured context (request id, user id); never log secrets or PII.

## 7. Security Coding Rules (must-follow)

- Parameterized queries only (ORM) — prevents SQL injection.
- Sanitize all rich text/HTML before storing/rendering — prevents XSS.
- Enforce authorization on the server for every action, including object-level checks.
- Verify webhook signatures; make money/publish mutations idempotent.
- Keep secrets in env/vault; `.env` is git-ignored; never commit keys.
- Keep dependencies patched; CI fails on high/critical vulnerabilities.
- (Full policy: `documents/05-Security-Design.md`.)

## 8. Testing Rules

- Every feature ships with tests (unit at minimum; integration/E2E where it touches I/O or UI).
- Name tests by behavior: `it('rejects publish when caller is not an editor')`.
- No network calls in unit tests; use fixtures/mocks and a disposable test DB for integration.
- Coverage: ≥ 70% overall, ≥ 85% for auth, billing, and workflow logic.
- (Full strategy: `documents/08-Test-Deployment.md`.)

## 9. Comments & Documentation

- Write code that explains itself; comment the **why**, not the **what**.
- Public functions/modules get short JSDoc where intent isn't obvious.
- Keep `README`, `CHANGELOG`, and relevant `documents/` updated when behavior changes.
- TODOs include an owner or issue: `// TODO(#123): paginate results`.

## 10. Git Hygiene

- Conventional Commits (see `09-Git-Workflow.md`); one logical change per commit.
- Small, focused PRs; branch off `dev`.
- No commented-out code, debug logs, or `console.log` left in production paths.
- Never commit `node_modules`, build output, or `.env` (see `.gitignore`).

## 11. Definition of Done

A change is "done" when:
- [ ] Meets its acceptance criteria and requirement (`01-SRS.md`).
- [ ] Follows these standards; lint, format, and type-check pass.
- [ ] Has tests, and the suite is green.
- [ ] Security rules (§7) satisfied.
- [ ] Docs/CHANGELOG updated.
- [ ] Reviewed and approved via PR into `dev`.

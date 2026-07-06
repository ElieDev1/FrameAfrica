# Contributing to Frame Africa

Thanks for contributing. This is the short version — the full workflow is in
[`documents/09-Git-Workflow.md`](documents/09-Git-Workflow.md).

## Branching

- `main` — production. **Protected. No direct commits.**
- `dev` — staging/integration. **Protected. No direct commits.**
- `feature/*`, `fix/*`, `chore/*` — your work branches, one per task.

## The rule of thumb

1. Branch **off `dev`**: `git checkout dev && git pull && git checkout -b feature/x`
2. **Commit every feature** with a Conventional Commit message (`feat:`, `fix:`, `docs:`…).
3. Push and open a **Pull Request into `dev`**.
4. CI + at least one review must pass, then **squash-merge** and delete the branch.
5. After `dev` is **tested on staging**, open a PR to **merge `dev` → `main`** (2 approvals), then tag a release.

## Commit format

```
<type>(<scope>): <subject>
```
Example: `feat(payments): add MTN MoMo checkout`

## Before you push

- Run lint, type-check, and tests locally.
- Never commit `.env`, secrets, or `node_modules`.
- Keep PRs small and focused.

See [`documents/09-Git-Workflow.md`](documents/09-Git-Workflow.md) for branch protection rules,
the hotfix flow, and the first-time setup commands.

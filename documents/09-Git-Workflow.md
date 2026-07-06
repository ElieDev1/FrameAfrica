# Frame Africa — Git & GitHub Workflow

**Document:** 09 — Git Workflow
**Version:** 1.0
**Applies to:** everyone contributing code to Frame Africa.

---

## 1. Branching Model

Frame Africa uses a **two-permanent-branch** model with short-lived feature branches.

```
main    ← production-ready, released code. Protected. Deploys to production.
 ▲
 │  (merge only after dev is tested & approved)
 │
dev     ← integration branch. Protected. Deploys to staging.
 ▲
 │  (Pull Request + review)
 │
feature/*  fix/*  chore/*   ← short-lived work branches (one per feature/fix)
```

| Branch | Purpose | Protected | Deploys to |
|---|---|---|---|
| `main` | Stable, released code | ✅ | Production |
| `dev` | Tested integration of features | ✅ | Staging |
| `feature/*` | One feature at a time | ❌ | Preview |
| `fix/*` | Bug fixes | ❌ | Preview |
| `chore/*` | Tooling, docs, config | ❌ | Preview |
| `hotfix/*` | Urgent production fix | ❌ | Preview → main + dev |

**Golden rules**
- **Never commit directly to `main` or `dev`.** All changes arrive via Pull Request.
- **Every feature = its own branch + its own PR**, merged into `dev`.
- **`dev` → `main` only after staging testing passes.**
- Keep branches small and short-lived (ideally < a few days).

## 2. The Flow (end to end)

```
1. Branch off dev            git checkout dev && git pull && git checkout -b feature/x
2. Build the feature         commit early, commit often (see §4)
3. Push the branch           git push -u origin feature/x
4. Open a PR → base: dev     fill the PR template, request review
5. CI runs + review          tests, lint, security scans must pass; ≥1 approval
6. Merge PR into dev         squash merge; delete the feature branch
7. Staging auto-deploys      QA / UAT test on staging
8. When dev is verified      open a PR: base main ← compare dev
9. Merge dev → main          after approval; tag a release
10. Production deploys        from main
```

## 3. Branch Naming

```
feature/<short-description>     feature/article-editor
feature/<ticket>-<desc>         feature/FA-42-comment-moderation
fix/<short-description>         fix/login-redirect
chore/<short-description>       chore/update-ci
hotfix/<short-description>      hotfix/payment-webhook-crash
```
Use lowercase, hyphens, no spaces. Reference the issue/ticket number where possible.

## 4. Commit Convention (Conventional Commits)

**Every feature and change must be committed** with a clear, structured message.

```
<type>(<scope>): <subject>

[optional body — what & why, not how]
[optional footer — BREAKING CHANGE / Closes #issue]
```

**Types**

| Type | Use for |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change, no feature/fix |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `chore` | Build, tooling, deps |
| `ci` | CI/CD changes |
| `security` | Security fix/hardening |

**Examples**
```
feat(articles): add scheduled publishing
fix(auth): rotate refresh token on reuse detection
feat(payments): integrate MTN MoMo checkout
docs(api): document comments endpoints
test(billing): cover paywall metering edge cases
security(comments): sanitize rich-text to prevent stored XSS
```

**Guidelines**
- Commit **each logical unit of work** — don't batch unrelated changes.
- Subject in imperative mood, ≤ 72 chars, no trailing period.
- Commit early and often; a feature branch will have many commits (they get squashed on merge).
- Never commit secrets, `.env` files, or large binaries.

## 4.1 Commit Granularity — after each change, not after the whole phase

**Rule of thumb: one commit = one thing you could describe in a single sentence
without saying "and".** Commit each piece as you finish it — do **not** save up a
whole feature, milestone, or roadmap phase into one giant commit.

**Why this matters**
- **Reviewable** — a reviewer can read a 30-line commit; nobody can meaningfully
  review a 12,000-line "phase done" dump.
- **Bisectable** — `git bisect` and `git revert` only help when each commit is a
  small, self-contained step.
- **Recoverable** — if work is interrupted (a crash, a lost session, running out of
  time), the finished pieces are already safely committed instead of lost.
- **Free** — feature-branch commits are **squashed on merge into `dev`** (§5), so many
  small commits still collapse into one clean commit on `dev`. Granularity costs you
  nothing and buys you all of the above.

**What counts as "one thing" (commit each of these separately)**
- Add a database table/model → `feat(db): add article_revision table`
- Add a module skeleton → `feat(content): scaffold content module`
- Wire one endpoint → `feat(content): add GET /articles/:slug`
- Add tests for that endpoint → `test(content): cover article-by-slug lookup`
- Fix one bug → `fix(auth): rotate refresh token on reuse`
- A tooling/config tweak → `chore(ci): cache pnpm store`

**Do**
```
feat(content): add article Prisma model
feat(content): add ContentModule + controller
feat(content): implement create-draft endpoint
test(content): cover create-draft validation
```

**Don't**
```
phase1: to be reviewed          # ❌ one commit for an entire phase
wip                             # ❌ meaningless subject, batches everything
update files                    # ❌ no scope, no logical unit
```

> **Anti-pattern from this repo:** the Phase 0 scaffold landed as a single
> `phase1: to be reviewed` commit. It was unreviewable, and a broken CI pipeline
> (ungenerated Prisma client, mismatched Jest versions) hid inside it. Had each
> piece been committed and pushed as it was added, the failure would have surfaced
> immediately and the history would tell the story of how the app was built.

**Practical rhythm**
1. Make one small, complete change (it builds / lints / — ideally — has its test).
2. `git add` **only** the files for that change (`git add -p` when a file mixes concerns).
3. Commit it with a Conventional Commit message (§4).
4. Repeat. Push regularly so work is backed up and CI runs early.

## 5. Pull Request Process

**Opening a PR**
- Base branch = `dev` (for features) or `main` (only for the tested `dev` → release).
- Title follows commit convention: `feat(articles): scheduled publishing`.
- Fill the PR template (§8): what changed, why, how tested, screenshots, linked issue.
- Keep PRs focused and reviewable (smaller is better).

**Review & merge requirements** (enforced by branch protection)
- ✅ CI green: lint, type-check, unit + integration tests, security scans.
- ✅ At least **1 approving review** (2 for `dev` → `main`).
- ✅ Branch up to date with base.
- ✅ No unresolved conversations.
- **Squash merge** into `dev` (clean, one commit per feature).
- **Delete** the feature branch after merge.

**`dev` → `main` release PR**
- Opened only after staging QA/UAT passes (`08-Test-Deployment.md`).
- Use a **merge commit** (not squash) to preserve dev history.
- Requires 2 approvals and a green pipeline.
- After merge, **tag a release** (§7) and production deploys.

## 6. Branch Protection Rules (GitHub settings)

Configure under **Settings → Branches** for both `main` and `dev`:

- Require a pull request before merging.
- Require approvals (main: 2, dev: 1).
- Require status checks to pass (CI, security scans).
- Require branches to be up to date before merging.
- Require conversation resolution.
- Require linear history (dev).
- Do **not** allow force pushes or deletions.
- Include administrators in restrictions.
- (Recommended) Require signed commits.

## 7. Releases & Tags

- Tag releases from `main` using **semantic versioning**: `vMAJOR.MINOR.PATCH` (e.g. `v1.2.0`).
- Auto-generate release notes from squashed commit messages.
- `MAJOR` = breaking, `MINOR` = new feature, `PATCH` = fix.

## 8. Hotfix Flow (urgent production bug)

```
git checkout main && git pull
git checkout -b hotfix/<desc>
# fix + commit
open PR → base main (expedited review)
merge → tag patch release → production deploys
then merge main back into dev (keep branches in sync)
```

## 9. First-time Setup — Initialize & Push

Run from the project root (`FrameAfrica/`):

```bash
# 1. Initialize
git init
git branch -M main

# 2. First commit (docs + structure)
git add .
git commit -m "chore: initial project structure and design docs"

# 3. Create the GitHub repo (via github.com or the gh CLI)
gh repo create frame-africa --private --source=. --remote=origin
# (or add an existing remote)
# git remote add origin https://github.com/<org>/frame-africa.git

# 4. Push main
git push -u origin main

# 5. Create and push dev off main
git checkout -b dev
git push -u origin dev

# 6. From now on, branch every feature off dev
git checkout dev
git checkout -b feature/<name>
```

Then set `dev` as the **default branch** for PRs and apply the protection rules in §6.

## 10. Day-to-day Cheat Sheet

```bash
# start a feature
git checkout dev && git pull
git checkout -b feature/comment-moderation

# work + commit often
git add <files>
git commit -m "feat(comments): add AI spam pre-screening"

# push and open PR (base: dev)
git push -u origin feature/comment-moderation

# keep your branch fresh if dev moved
git checkout dev && git pull
git checkout feature/comment-moderation
git rebase dev        # or: git merge dev

# after PR is merged
git checkout dev && git pull
git branch -d feature/comment-moderation
```

## 11. What NOT to do

- ❌ Commit directly to `main` or `dev`.
- ❌ Merge `dev` → `main` before staging tests pass.
- ❌ Push secrets, `.env`, `node_modules`, or build artifacts (see `.gitignore`).
- ❌ Force-push shared branches.
- ❌ Open giant, unfocused PRs mixing many features.

---

*This workflow pairs with the CI/CD pipeline in `08-Test-Deployment.md` §10 — the pipeline enforces the checks this document requires.*

# Frame Africa — Test Plan & Deployment / DevOps

**Document:** 08 — Test & Deployment
**Version:** 1.0

---

## PART A — TEST PLAN

## 1. Objectives
Verify that Frame Africa meets its functional requirements (`01`), performs within its non-functional targets, and is secure (`05`) before every release.

## 2. Test Levels

| Level | What | Tools |
|---|---|---|
| Unit | Functions, services, components in isolation | Jest, React Testing Library |
| Integration | Module + DB + cache interactions | Jest + test DB (Testcontainers) |
| API / contract | Endpoints match OpenAPI spec | Supertest, Dredd/Pact |
| End-to-end | Real user journeys in a browser | Playwright / Cypress |
| Performance | Load, stress, soak | k6 / Artillery |
| Security | Vuln scanning, pen test | ZAP, Snyk, manual |
| Accessibility | WCAG checks | axe, Lighthouse, manual SR testing |

## 3. Test Strategy
- **Test pyramid**: many unit, fewer integration, fewest E2E.
- **CI gate**: unit + integration + lint + type-check + security scans must pass to merge.
- **Coverage target**: ≥ 70% overall, ≥ 85% on auth, billing, and workflow logic.
- **Test data**: seeded fixtures; no production data in tests.
- **Environments**: run against ephemeral/staging, never production.

## 4. Representative Test Cases

| ID | Area | Scenario | Expected |
|---|---|---|---|
| TC-01 | Auth | Register with existing email | 409 conflict |
| TC-02 | Auth | 6 failed logins | Lockout + audit log |
| TC-03 | Auth | Refresh-token reuse | Whole token family revoked |
| TC-04 | Workflow | Journalist tries to publish | 403 forbidden |
| TC-05 | Workflow | Editor publishes → page live | Indexed, ISR revalidated |
| TC-06 | Corrections | Add correction to published article | Dated notice visible |
| TC-07 | Paywall | Over-meter anonymous opens premium | 402 + preview + prompt |
| TC-08 | Payment | Replayed webhook | No double activation (idempotent) |
| TC-09 | Comments | XSS payload in comment | Sanitized, no script executes |
| TC-10 | AuthZ (IDOR) | Access another user's draft by ID | 403 |
| TC-11 | Search | Misspelled query | Typo-tolerant results |
| TC-12 | i18n | Switch to Kinyarwanda | UI + article variant load |
| TC-13 | A11y | Keyboard-only article read | All actions reachable, focus visible |
| TC-14 | Perf | Homepage on 3G | FCP < 2s |
| TC-15 | Privacy | Request account erasure | PII anonymized, confirmation sent |

## 5. Non-Functional Testing
- **Load/stress**: simulate breaking-news spike; verify auto-scaling and CDN offload; find the breaking point.
- **Soak**: sustained traffic to catch leaks.
- **Failover**: kill a node/AZ; verify recovery and no data loss.
- **Backup restore drill**: restore from backup to a clean env on a schedule.

## 6. Security Testing (ties to `05`)
- SAST + dependency + container scans in CI on every PR.
- Dynamic scan (ZAP) against staging.
- Manual/3rd-party **penetration test** before major launches; criticals block release.
- Targeted regression suites for OWASP Top 10 (injection, access control, XSS, auth).

## 7. UAT & Sign-off
- Editorial staff validate the CMS workflow against real newsroom scenarios.
- Acceptance criteria in `01-SRS.md` §5 must all pass.
- Defects triaged by severity; blockers fixed before go-live.

---

## PART B — DEPLOYMENT / DEVOPS

## 8. Environments

| Env | Purpose | Data |
|---|---|---|
| Local | Dev via Docker Compose | Seed data |
| Staging | QA, UAT, preview links | Anonymized/sample |
| Production | Live | Real, protected |

## 9. Containerization & Orchestration
- Every service ships as a **Docker** image (multi-stage, minimal, non-root).
- **Kubernetes** for orchestration (start simple; scale as traffic grows): deployments, HPA autoscaling, health/readiness probes, secrets from vault, network policies.
- Stateless API pods; managed PostgreSQL, Redis, OpenSearch, and object storage.

## 10. CI/CD Pipeline (GitHub Actions)

```
push / PR
  → install + lint + type-check
  → unit + integration tests
  → security scans (SAST, deps, container)
  → build Docker images
  → (PR) deploy preview / (main) deploy staging
  → E2E + a11y + smoke on staging
  → manual approval
  → deploy production (rolling / blue-green)
  → post-deploy smoke + monitor
  → auto-rollback on failed health checks
```

- **Migrations** run as a gated, reversible step before app rollout.
- **Secrets** injected from a vault, never in the repo.
- **Feature flags** decouple deploy from release.

## 11. Release Strategy
- **Rolling or blue-green** deploys for zero downtime.
- **Canary** for risky changes (small % of traffic first).
- **Rollback** plan documented; one command / one click.
- ISR revalidation + CDN purge coordinated with content changes.

## 12. Observability
- **Metrics**: Prometheus + Grafana (latency, error rate, saturation, business KPIs).
- **Logs**: central structured logging with correlation IDs; PII scrubbed.
- **Tracing**: OpenTelemetry across frontend → API → data.
- **Uptime**: external monitors + status page.
- **Alerting**: on SLO breaches, error spikes, WAF/security events, payment failures; on-call rotation.

## 13. Reliability & DR
- SLOs: availability ≥ 99.9% (→99.99%), API p95 < 300ms, search p95 < 1s.
- Multi-AZ; automated daily + weekly backups; point-in-time recovery.
- Documented disaster-recovery runbook with RTO/RPO targets; periodic restore drills.
- Incident response per `05` §14 with blameless post-mortems.

## 14. Configuration & Compliance
- 12-factor config via environment; per-env isolation.
- Cookie-consent, privacy, and terms shipped before launch.
- Rwanda Law N° 058/2021 data-handling verified (export/erasure live, encryption on).

## 15. Go-Live Checklist
- [ ] All acceptance criteria pass (`01` §5)
- [ ] Security checklist complete (`05` §16)
- [ ] Load test passes target concurrency
- [ ] Backups + restore verified
- [ ] Monitoring, alerting, status page live
- [ ] SEO: sitemaps, Google News, structured data validated
- [ ] Legal pages + consent live
- [ ] Rollback tested
- [ ] On-call rotation set

---

## PART C — Traceability Matrix (excerpt)

| Requirement | Design | Use case | Test |
|---|---|---|---|
| FR-AUTH-7 (sessions) | 05 §3 | UC-02 | TC-03 |
| FR-EDIT-1 (review) | 02 §6 | UC-04 | TC-04, TC-05 |
| FR-EDIT-5 (corrections) | 03 §3.6 | UC-05 | TC-06 |
| FR-SUB-1 (paywall) | 04 §7 | UC-01, UC-07 | TC-07 |
| FR-SUB-3 (MoMo) | 04 §7 | UC-07 | TC-08 |
| FR-COMM-3 (AI screen) | 02 §5 | UC-06 | TC-09 |
| FR-AUTH-8 (erasure) | 05 §9 | UC-12 | TC-15 |
| NFR-PERF-1 (homepage) | 02 §8 | UC-01 | TC-14 |

*(Full matrix maintained here and updated each release.)*

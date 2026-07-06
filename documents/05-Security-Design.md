# Frame Africa — Security Design

**Document:** 05 — Security Design
**Version:** 1.0
**Scope:** Applies to every component. Read alongside all other docs.
**Frameworks referenced:** OWASP Top 10 (2021), OWASP ASVS, WCAG (safety-adjacent), Rwanda Law N° 058/2021.

---

## 1. Security Principles

1. **Defense in depth** — no single control is trusted alone.
2. **Least privilege** — every actor and service gets the minimum access needed.
3. **Secure by default** — deny first; explicitly allow.
4. **Never trust input** — validate and encode everything crossing a boundary.
5. **Assume breach** — log, monitor, and limit blast radius.
6. **Privacy by design** — collect minimally, protect always, honor erasure.

## 2. Trust Boundaries

```
Internet ──► Cloudflare (WAF/DDoS) ──► Next.js (BFF) ──► NestJS API ──► Data stores
   ▲ untrusted        ▲ edge filter       ▲ session/CSRF     ▲ authZ/validation   ▲ encrypted
```
Every arrow is a boundary that authenticates, validates, and logs. Secrets never cross toward the browser.

## 3. Authentication

### 3.1 Passwords
- Hashed with **Argon2id** (or bcrypt cost ≥ 12). Never stored or logged in plaintext.
- Enforced strength (length ≥ 8, breach-list check via k-anonymity).
- Reset tokens are single-use, short-lived, and hashed at rest.

### 3.2 Tokens & sessions
- **Access JWT**: short-lived (~15 min), signed (RS256/ES256), minimal claims (`sub`, `roles`, `exp`).
- **Refresh token**: long-lived, stored **HTTP-only + Secure + SameSite=Strict cookie**, rotated on every use with **reuse detection** (a replayed refresh token revokes the whole family).
- No tokens in `localStorage` (XSS-exfiltration risk). Browser-held session lives only in cookies.
- Server-side session/revocation list in Redis for immediate logout and ban enforcement.

### 3.3 Multi-factor & social
- **2FA mandatory for all staff** (TOTP); optional for readers. Backup codes issued once.
- OAuth (Google/Apple) validates `id_token` signature, `aud`, `iss`, and nonce.
- Phone OTP is rate-limited and single-use with short expiry.

### 3.4 Brute-force & credential-stuffing defense
- Progressive lockout/backoff after failed attempts; CAPTCHA on suspicion.
- Cloudflare bot management + rate limiting at the edge.
- Alerting on anomalous login geography/velocity.

## 4. Authorization (RBAC)

- Central **RBAC** with roles: reader, journalist, sub_editor, photographer, editor, moderator, ads_manager, admin.
- Enforced by NestJS **guards** on every protected route; the frontend hides UI but **the server is the source of truth**.
- **Object-level checks** ("can this user edit *this* article?") in addition to role checks — prevents IDOR.
- Workflow transitions are permission-gated by role **and** current state.
- Deny-by-default: an endpoint without an explicit policy is inaccessible.

## 5. OWASP Top 10 — Mitigations

| Risk | Mitigation in Frame Africa |
|---|---|
| **A01 Broken Access Control** | Server-side RBAC + object-level authZ; deny by default; no client-trusted role checks; IDOR tests in CI |
| **A02 Cryptographic Failures** | TLS 1.2+ everywhere; Argon2id passwords; secrets in a vault; AES-256 at rest; encrypted backups |
| **A03 Injection** | Parameterized queries via ORM; no string-built SQL; input validation; output encoding; NoSQL/command injection avoided |
| **A04 Insecure Design** | Threat modeling (this doc); secure defaults; abuse cases in `07`; rate limits on sensitive flows |
| **A05 Security Misconfiguration** | Hardened images; least-privileged containers; no default creds; security headers; disabled debug in prod |
| **A06 Vulnerable Components** | Dependency scanning (Dependabot/`npm audit`/Snyk); pinned versions; regular patching |
| **A07 Auth Failures** | Strong session mgmt (§3); 2FA; lockout; refresh rotation + reuse detection |
| **A08 Data Integrity Failures** | Signed webhooks; SRI for third-party scripts; verified CI artifacts; no untrusted deserialization |
| **A09 Logging & Monitoring Failures** | Central structured logs; audit trail; alerting; tamper-resistant log store |
| **A10 SSRF** | Allow-list outbound calls; validate/normalize URLs; block internal metadata endpoints; egress controls |

## 6. Input Validation & Output Encoding

- **Every** request body/query/param validated against a DTO schema (class-validator); reject unknown fields.
- **Rich-text sanitization**: article and comment HTML passed through an allow-list sanitizer (e.g. DOMPurify server-side) — strips scripts, event handlers, and dangerous tags. Prevents stored **XSS**.
- **Output encoding** by React by default; `dangerouslySetInnerHTML` used only on sanitized content.
- File uploads: type/size checks, content-sniffing, re-encoding of images, virus/malware scan, randomized storage keys, served from a separate media domain.

## 7. Web Security Controls (Next.js frontend)

**HTTP security headers** (set at edge and app):
```
Content-Security-Policy: default-src 'self'; img-src 'self' https://cdn.frameafrica.rw data:;
  script-src 'self' 'nonce-…'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
```
- **CSRF**: state-changing requests protected by SameSite cookies + anti-CSRF token (double-submit) for cookie-authenticated actions.
- **CORS**: strict allow-list of origins; credentials only for trusted origins.
- **Clickjacking**: `frame-ancestors 'none'`.
- **Secrets**: never shipped to the client; only `NEXT_PUBLIC_*` values are public. Server Actions/route handlers hold API keys.

## 8. API & Backend Security (Node.js / NestJS)

- Global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`.
- `helmet` for headers, `express-rate-limit`/`ThrottlerGuard` for throttling.
- Idempotency keys on payment/publish mutations.
- Webhook endpoints verify provider signatures and are replay-protected.
- Structured error filter: **no stack traces or internal details leak** to clients.
- Request size limits; timeouts; circuit breakers on external calls.
- Principle of least privilege for DB credentials (separate read/write roles).

## 9. Data Protection & Privacy (Rwanda Law N° 058/2021)

- **Lawful basis & consent**: cookie consent banner; granular marketing opt-in.
- **Data minimization**: collect only what a feature needs.
- **Encryption**: TLS in transit; AES-256 at rest for DB, backups, and media; field-level encryption for 2FA secrets and sensitive PII.
- **Data subject rights**: self-service **data export** and **account deletion / erasure**; erasure anonymizes PII while preserving thread/audit integrity.
- **Retention**: defined per data type (analytics 24 mo; audit per law); automatic purge jobs.
- **Cross-border**: hosting/region choices documented; data-processing agreements with vendors.
- **Breach response**: documented plan with notification obligations under Rwandan law.

## 10. Secrets & Key Management

- Secrets in a managed vault / KMS (never in git, never in client bundles).
- Rotation policy for keys, tokens, and DB credentials.
- Separate credentials per environment; production access is broker-audited.
- `.env` files git-ignored; CI uses encrypted secret stores.

## 11. Whistleblower / Anonymous Tips (high-sensitivity)

- Dedicated intake that does **not** log IP or identifying metadata by design.
- Encrypted storage, access restricted to a minimal newsroom group.
- No third-party trackers on the tips page; optional Tor-friendly access.
- Clear editorial handling procedure to protect sources.

## 12. Infrastructure & Network Security

- Cloudflare WAF + DDoS protection + bot management at the edge.
- Private networking: databases and internal services not publicly reachable.
- Least-privileged, non-root containers; read-only filesystems where possible.
- Network policies restrict service-to-service traffic to what's required.
- TLS termination at edge with modern ciphers; HSTS preload.
- Automated patching of base images; image vulnerability scanning in CI.

## 13. Content Integrity & Anti-Misinformation

- Immutable **revision history** and public **corrections** protect editorial integrity.
- **Right-of-reply logging** on sensitive stories.
- AI misinformation flags are **advisory** and routed to human fact-checkers.
- Media provenance metadata (credit, source, license) retained per asset.

## 14. Logging, Monitoring & Incident Response

- **Audit log** of all privileged/sensitive actions (who, what, when, from where).
- Central structured logging with correlation IDs; PII scrubbed from logs.
- Real-time alerting: auth anomalies, error spikes, WAF events, payment failures.
- Uptime, performance, and security dashboards (Prometheus/Grafana + SIEM).
- **Incident response plan**: detect → contain → eradicate → recover → post-mortem, with severity levels and on-call rotation. Blameless post-mortems.

## 15. Secure SDLC

- Security requirements captured up front (this doc).
- Code review required on every change; secret-scanning pre-commit and in CI.
- SAST + dependency scanning + container scanning in the pipeline.
- Periodic **penetration testing** and remediation tracking.
- Security regression tests for auth, access control, and injection.

## 16. Security Checklist (pre-launch)

- [ ] TLS + HSTS on all domains
- [ ] Passwords Argon2id; 2FA enforced for staff
- [ ] Refresh-token rotation + reuse detection live
- [ ] RBAC + object-level checks on every protected route
- [ ] CSP, security headers, CORS allow-list configured
- [ ] Rich-text/comment sanitization verified against XSS payloads
- [ ] Parameterized queries only; injection tests pass
- [ ] Rate limiting + lockout on auth and sensitive endpoints
- [ ] Webhook signature verification + idempotency
- [ ] Secrets in vault; none in client bundle or git
- [ ] Data export + erasure flows working
- [ ] Backups encrypted and restore-tested
- [ ] Audit logging + alerting operational
- [ ] Dependency, SAST, and container scans clean
- [ ] Penetration test completed and criticals fixed

---

*This security posture is a requirement, not an add-on: every feature in `01`, endpoint in `04`, and table in `03` inherits these controls.*

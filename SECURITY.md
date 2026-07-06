# Security Policy

Frame Africa takes the security of our platform, our journalists, and our readers
seriously. This file explains how to report vulnerabilities. The full engineering
security design lives in [`documents/05-Security-Design.md`](documents/05-Security-Design.md).

## Supported Versions

| Version | Supported |
|---|---|
| Latest `main` (production) | ✅ |
| `dev` (staging) | ✅ |
| Older tags | ❌ |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately:

- Email: **security@frameafrica.rw** (use PGP if possible)
- Or use GitHub's **private vulnerability reporting** (Security tab → "Report a vulnerability").

Please include:
- A description of the vulnerability and its impact.
- Steps to reproduce (proof of concept if possible).
- Affected component/URL/version.
- Any suggested remediation.

## What to Expect

- **Acknowledgement** within 3 business days.
- **Assessment & severity triage** within 7 business days.
- Progress updates until resolution.
- Credit for responsible disclosure (if you wish) once the fix ships.

## Scope

In scope: the Frame Africa web app, APIs, mobile apps, and infrastructure we operate.
Out of scope: third-party services (report to the respective vendor), social-engineering,
physical attacks, and volumetric DoS testing.

## Responsible Disclosure

Please give us reasonable time to fix an issue before any public disclosure, and avoid
accessing or modifying other users' data, degrading service, or exfiltrating information.
We will not pursue legal action against good-faith researchers who follow this policy.

## Sensitive Sources

Frame Africa operates a secure, anonymous tips channel for whistleblowers
(see `documents/05-Security-Design.md` §11). Vulnerabilities affecting source
protection are treated as **critical** — please flag them as such.

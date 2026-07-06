# Frame Africa — Product Roadmap

**Document:** 11 — Roadmap
**Version:** 1.0
**Note:** Directional, not contractual. Reprioritize as we learn.

---

## Vision

Become one of Rwanda's leading digital newspapers and a trusted pan-African news
source — fast, credible, multilingual, and mobile-first.

## Release Milestones

### v0.1 — Foundation (current)
- Repository, documentation set, and Git/GitHub workflow.
- Architecture, database, API, security, and UI/UX designs approved.
- CI/CD skeleton and environments defined.

### v1.0 — MVP (Public launch)
**Goal:** publish and read news reliably in English + Kinyarwanda.
- CMS with editorial workflow (draft → review → publish), revisions, corrections.
- Article, category (nested), tags, media (images/video), search.
- Responsive public site (homepage, article, category, search) with dark mode.
- Reader accounts: register/login, bookmark, comment (with moderation).
- Basic ads + public notices/obituaries/tenders.
- Payments: MTN MoMo & Airtel Money; simple subscription + metered paywall.
- SEO essentials, analytics, backups, security baseline.

### v1.5 — Growth
- PWA + offline reading; low-bandwidth data-saver mode.
- Newsletters (digests) with delivery analytics.
- Push notifications (web + mobile) and breaking-news alerts.
- Live blog / real-time tickers (elections, sports).
- Author profiles, related-articles engine, reading history.
- Expanded analytics (funnels, churn, scroll depth) and A/B headline testing.

### v2.0 — Intelligence & Scale
- AI assistance: summaries, headline/tag suggestions, translation, TTS, recommendations.
- AI comment moderation and misinformation-flagging (human-in-the-loop).
- Native Android & iOS apps.
- Full multilingual (French, optional Kiswahili) with `hreflang`.
- E-paper/PDF edition; open syndication API.
- Hardening toward 99.99% uptime, higher concurrency, advanced observability.

## Themes Across Releases

| Theme | Always-on commitment |
|---|---|
| Trust | Corrections, transparency, fact-checking, source protection |
| Speed | Performance budgets, CDN/edge caching, Core Web Vitals |
| Access | Accessibility (WCAG AA), low-bandwidth, multilingual |
| Security | OWASP controls, audits, data-protection compliance |
| Sustainability | Subscriptions, ads, notices — diversified revenue |

## Success Metrics (examples)

- Time-to-publish and workflow throughput (newsroom efficiency).
- Monthly active readers, returning-reader rate.
- Subscriber conversion and churn.
- Homepage/article performance (FCP, LCP).
- Uptime and incident count.

## Out of Scope (for now)

- Classifieds marketplace, dedicated video-on-demand platform, and third-party
  developer marketplace — revisit post-v2.0.

---

*Milestones map to requirements in `01-SRS.md` and are delivered through the branching
workflow in `09-Git-Workflow.md`.*

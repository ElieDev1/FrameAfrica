# Frame Africa — System Documentation

> **NEWS. VIEWS. AFRICA.**
> A modern, AI-assisted digital newspaper platform built for Rwanda and the wider African audience.

![Frame Africa Logo](../assets/frame-africa-logo.png)

---

## 1. Overview

**Frame Africa** is a digital news platform whose mission is to deliver fast, credible, multilingual journalism to readers across Rwanda and Africa. The name and mark — an African continent framed by a camera aperture — express the editorial promise: *bringing Africa's stories into focus.*

This document explains the whole system: what it does, who uses it, how it is organized, the data it manages, the technology it runs on, and the requirements it must satisfy.

**At a glance**

| Item | Detail |
|---|---|
| Product name | Frame Africa |
| Tagline | NEWS. VIEWS. AFRICA. |
| Type | Digital newspaper / online news platform |
| Primary market | Rwanda, expanding across Africa |
| Languages | English, Kinyarwanda, French, Kiswahili (optional) |
| Core promise | Fast, credible, multilingual, mobile-first news |

### Brand identity (from the logo)

| Element | Value |
|---|---|
| Wordmark | "Frame" in **white**, "Africa" in **orange** |
| Mark | Africa map with a camera-aperture lens |
| Accent palette | Red, orange, yellow, green (Pan-African warmth) |
| Background | Deep black / charcoal |
| Tone | Bold, modern, editorial, pan-African |

Suggested design tokens for the build:

```
--color-bg:        #0A0A0A   /* near-black background */
--color-surface:   #161616   /* cards, panels */
--color-primary:   #F39200   /* "Africa" orange — links, CTAs */
--color-accent-1:  #E2231A   /* red */
--color-accent-2:  #FFC20E   /* yellow */
--color-accent-3:  #2E7D32   /* green */
--color-text:      #FFFFFF   /* primary text on dark */
--color-muted:     #B0B0B0   /* secondary text */
```

---

## 2. Goals & Objectives

1. Publish news quickly and reliably, including live/breaking coverage.
2. Earn reader trust through transparent, correctable, fact-checked journalism.
3. Reach low-bandwidth and mobile-first audiences across Africa.
4. Serve content in multiple languages, starting with English and Kinyarwanda.
5. Build sustainable revenue through subscriptions, advertising, and notices.
6. Use AI responsibly to assist (not replace) the newsroom.

---

## 3. User Roles

The platform is organized around clearly separated roles, each with its own permissions.

### Public / Visitor
Browse and read news without an account, search articles, view images and video, share stories, subscribe to newsletters, and see advertisements.

### Registered User (Reader)
Everything a visitor can do, plus: register and log in, reset password, update profile, bookmark articles, keep a reading history, follow favorite categories, comment, report abuse, receive notifications, and manage subscriptions and notification preferences.

### Journalist / Reporter
Write and draft articles; upload images, video, audio, and documents; add tags; select categories; schedule publishing; edit their own work; and submit articles for review. Contact-with-subject / right-of-reply is logged here.

### Sub-editor / Copy Editor *(added role)*
Polishes grammar, style, headlines, and structure. Cannot approve for publication — hands clean copy back to editors.

### Photographer / Videographer *(added role)*
Uploads and owns media assets, sets credits and licensing metadata, manages galleries.

### Editor
Reviews submitted articles; approves, rejects, or edits them; assigns reporters; publishes immediately or on schedule; features breaking news; manages corrections; and archives content.

### Community Moderator *(added role)*
Owns comment moderation: approves, hides, or removes comments, bans abusive users, and tunes the AI spam/abuse filters.

### Advertising / Sales Manager *(added role)*
Manages ad campaigns, sponsored content, notices/tenders, and revenue reporting — separate from system administration.

### Administrator
Manages users, journalists, editors, and permissions; categories; advertisements; homepage layout; newsletters and notifications; views analytics; runs backups and restores; and configures system settings.

---

## 4. Functional Requirements (What the system does)

### 4.1 Authentication
Email login, social login (Google, Apple), phone-number login, two-factor authentication, password reset, email verification, and session management. **Account deletion and data export** (right-to-be-forgotten) are included for legal compliance.

### 4.2 Homepage
Breaking-news banner and ticker, trending stories, latest news, featured and popular articles, most-read list, editor's picks, videos, live updates, advertisement slots, and widgets (weather, stock market, social feeds).

### 4.3 Categories
A nestable, unlimited-depth taxonomy plus free-form tagging. Launch set includes: Politics, Rwanda, Africa, World, Business, Economy, Technology, Health, Education, Agriculture, Environment, Sports, Entertainment, Lifestyle, Tourism, Opinion, Investigations, and Fact Check.

### 4.4 Article Management
Each article supports: title, subtitle, author, co-author, category, tags, featured image, image gallery, video, audio, rich text, references, SEO title/description, meta keywords, canonical URL, publish/update dates, scheduled publishing, read time, view count, likes, shares, and status.

**Editorial workflow states** (expanded): `Draft → Assigned → In Progress → Copy-edit → Fact-check → Legal review → Ready → Scheduled/Embargoed → Published → (Correction pending) → Archived`.

**Version history / revision control** — every edit is tracked with author, timestamp, and rollback.

**Corrections & retractions** — correction notices append to articles, an "updated on / what changed" log is shown publicly, and a dedicated Corrections page maintains transparency. *(Critical for newsroom credibility and legal safety.)*

**Embargo handling** — content can be locked until a set release time.

### 4.5 Multimedia
Images, video, podcasts, audio news, PDFs, documents, live streaming, photo galleries, and interactive graphics. A Digital Asset Management layer handles credits, licensing, responsive image variants (WebP/AVIF), focal-point cropping, and video transcoding.

### 4.6 Search
Keyword, author, category, and date search; advanced filters; typo tolerance; autocomplete suggestions; trending searches; and clean "no results" handling. Powered by a dedicated search engine (Elasticsearch/OpenSearch).

### 4.7 Notifications
Breaking-news alerts, personalized alerts, email, browser push, mobile push, and optional SMS. Includes a notification inbox/history and quiet-hours batching. Breaking-news pushes to large audiences require editor approval.

### 4.8 Comments
Add, reply (threaded), like, report abuse, moderate, and AI spam/abuse detection, with user banning and a profanity filter.

### 4.9 Newsletter
Subscribe/unsubscribe, daily and weekly digests, breaking-news emails, and category-based newsletters — with deliverability handling (bounces, unsubscribe compliance) and open/click analytics.

### 4.10 Advertising & Notices
Banner, video, sponsored, and native ads; Google AdSense integration; campaign management; click tracking; and revenue reports. Includes frequency capping, `ads.txt`, house ads, and ad-blocker handling. **Public notices, tenders, and obituaries** are supported as a distinct, monetizable section (an important revenue line in the Rwandan market).

### 4.11 Analytics
Total and active users, views per article, trending news, bounce rate, session duration, reader locations, device stats, and revenue analytics — plus scroll depth, article-completion rate, subscriber conversion funnel, churn, and newsletter attribution.

### 4.12 Social Media
Share buttons, auto-posting to social platforms, social login, and embedded social feeds.

### 4.13 AI Features (competitive advantage)
Article summaries, headline suggestions, translation, auto-tagging, SEO optimization, plagiarism detection, fake-news detection assistance, a recommendation engine, text-to-speech, and automatic categorization. **AI assists the newsroom; humans remain accountable for what is published.**

### 4.14 Mobile & Access
Responsive website, Progressive Web App (PWA), Android and iOS apps, offline reading, and a **low-bandwidth / data-saver mode** for wider reach across Africa.

### 4.15 Multilingual
English, Kinyarwanda, French, and optional Kiswahili, with `hreflang` for correct search indexing and AI-assisted translation workflows.

### 4.16 Live News
Live blog, live score updates, election results, breaking-news ticker, and real-time updates.

### 4.17 Subscription System
Free and premium articles, a **metered paywall** (a set number of free articles per period), monthly and annual plans, student discounts, invoice generation, and payment integration. **Rwanda-first payments: MTN MoMo and Airtel Money alongside cards**, priced in RwF.

### 4.18 Archive
Year, month, category, author, and search archives, plus an optional **e-paper / PDF replica** and print-friendly article views.

### 4.19 Contact & Tips
Contact form, story-tips submission, a **secure anonymous whistleblower channel**, newsroom contacts, and a careers page.

### 4.20 Admin Dashboard
Live view of users, journalists, editors, revenue, visitors, articles, comments, breaking news, analytics, and system health — plus an assignment desk / editorial calendar.

---

## 5. Non-Functional Requirements (How well it performs)

**Performance** — Homepage under 2s, search under 1s, image optimization and caching, explicit Core Web Vitals targets, lazy loading, and service-worker caching.

**Scalability** — Horizontal scaling, CDN, cloud deployment, auto-scaling, and distributed databases. Target: support large concurrency spikes during major breaking-news events (phase capacity — e.g. start with solid tens-of-thousands concurrency, grow toward 100k).

**Availability** — Load balancing, failover servers, disaster recovery, and automatic backups. Target uptime **99.9% at launch, growing toward 99.99%** (the higher figure is costly — phase it).

**Reliability** — No data loss, automatic recovery, transaction integrity, and backup verification.

**Security** — HTTPS everywhere, hashed passwords, 2FA, SQL-injection / XSS / CSRF / DDoS protection, malware scanning, audit logging, and role-based access control.

**Usability** — Clean, mobile-first, consistent interface; accessible navigation; clear typography; and dark mode (native to the brand).

**Maintainability** — Modular architecture, documented and versioned APIs, code documentation, automated testing, easy deployment, logging, and monitoring. Includes a **staging environment with article preview links** and **A/B testing** (especially headline testing).

**Compatibility** — Chrome, Firefox, Edge, Safari; Android, iOS; tablet and desktop.

**Accessibility** — Keyboard navigation, screen-reader support, alt text, video captions, adequate color contrast, and adjustable font sizes (WCAG-aligned).

**SEO** — Schema.org structured data (`NewsArticle`), XML sitemap **plus a Google News sitemap**, `robots.txt`, canonical URLs, Open Graph and Twitter Cards, breadcrumbs, `hreflang`, and fast page speed. Register with Google Publisher Center.

**Backup & Recovery** — Daily and weekly full backups, point-in-time recovery, and redundant cloud storage.

**Monitoring & Observability** — Error, server, security, performance, and uptime monitoring, plus distributed tracing and API rate limiting.

**Compliance** — Privacy policy, cookie consent, terms of service, copyright management, and **Rwanda's Law N° 058/2021 on Protection of Personal Data and Privacy**, alongside Rwanda Media Commission and RURA regulations. Right-of-reply and corrections practices support media-law compliance.

---

## 6. System Architecture

Frame Africa follows a layered, service-oriented architecture.

```
                    ┌─────────────────────────────┐
                    │        READERS / STAFF       │
                    │  Web · PWA · Android · iOS    │
                    └──────────────┬──────────────┘
                                   │  HTTPS
                    ┌──────────────▼──────────────┐
                    │        Cloudflare CDN        │
                    │   caching · DDoS · images    │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   Frontend (Next.js/React)   │
                    │  SSR/SSG · SEO · i18n · PWA  │
                    └──────────────┬──────────────┘
                                   │  REST / GraphQL (JWT)
      ┌────────────────────────────┼────────────────────────────┐
      │                            │                            │
┌─────▼─────┐  ┌──────────────┐  ┌─▼────────────┐  ┌───────────▼───┐
│  Backend  │  │   Search     │  │   Media /    │  │  AI Services  │
│ (NestJS/  │  │ Elasticsearch│  │  Streaming   │  │ summaries,    │
│  Laravel) │  │  /OpenSearch │  │  (S3 + HLS)  │  │ translation,  │
│  APIs,    │  │              │  │              │  │ recommend,    │
│  auth,    │  └──────────────┘  └──────────────┘  │ moderation    │
│  workflow │                                       └───────────────┘
└─────┬─────┘
      │
┌─────▼─────┐   ┌──────────┐   ┌────────────────┐   ┌──────────────┐
│PostgreSQL │   │  Redis   │   │ Object storage │   │  Firebase    │
│ (primary) │   │ (cache)  │   │  (S3-compat)   │   │  (push msgs) │
└───────────┘   └──────────┘   └────────────────┘   └──────────────┘
```

**Three logical layers**

1. **Presentation** — what readers and staff see (site, apps, admin dashboard, CMS UI).
2. **Application / business logic** — publishing rules, workflow, permissions, paywall metering, AI orchestration, notifications.
3. **Data** — PostgreSQL for structured data, Redis for caching, object storage for media, and the search index.

---

## 7. Data Model (core entities)

```
User ──< Subscription
User ──< Bookmark >── Article
User ──< Comment  >── Article
User ──< Notification

Article >── Category (self-referencing, nestable)
Article ──< ArticleTag >── Tag
Article ──< MediaAsset            (image, video, audio, pdf)
Article ──< ArticleRevision       (version history)
Article ──< Correction
Article ── SEOMeta (1:1)
Article ── Author / Co-author     (User)

Advertisement >── Campaign >── Advertiser
Newsletter ──< NewsletterSubscription >── User
Notice (tender / obituary / public notice) >── Category
```

**Key relationships in words**

- One journalist writes many articles; an article has one primary author and optional co-authors.
- An article belongs to one category (categories nest infinitely) and carries many tags.
- An article has many revisions, many media assets, many comments, and zero-or-more corrections.
- A reader can bookmark many articles and hold one active subscription.
- Advertisements roll up into campaigns owned by advertisers.

---

## 8. Recommended Technology Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (React) + TypeScript |
| Backend | NestJS or Laravel |
| Database | PostgreSQL |
| Search | Elasticsearch or OpenSearch |
| Caching | Redis |
| Media storage | Object storage (S3-compatible) |
| CDN | Cloudflare |
| Auth | OAuth 2.0 + JWT |
| Push notifications | Firebase Cloud Messaging |
| Streaming | WebRTC or HLS |
| Payments | MTN MoMo, Airtel Money, card gateway |
| Containerization | Docker |
| Orchestration | Kubernetes (as you scale) |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Analytics | Google Analytics or Matomo |

---

## 9. What Sets Frame Africa Apart

- AI-powered personalized news feeds and text-to-speech article reading.
- Offline and low-bandwidth reading built for African connectivity.
- Interactive infographics and data visualizations.
- Live blogs for elections, sports, and emergencies.
- A transparent fact-checking portal with visible evidence.
- Secure, anonymous crowdsourced story tips.
- AI-assisted multilingual publishing (English · Kinyarwanda · French · Kiswahili).
- Full editorial workflow with version history, corrections, and approval chains.
- Public-notices/tenders/obituaries as a local revenue engine.
- An open API for syndication partners.

---

## 10. Suggested Delivery Phases

| Phase | Focus |
|---|---|
| **1 — MVP** | CMS, articles, categories, homepage, search, comments, responsive site, English + Kinyarwanda, basic ads, MoMo/Airtel payments |
| **2 — Growth** | PWA + mobile apps, newsletters, push notifications, subscriptions/paywall, analytics, live blog |
| **3 — Scale** | AI features, recommendations, e-paper, multilingual expansion, open API, advanced observability, 99.99% targets |

---

## 11. Assets

The logo lives in `assets/`. See `assets/README.txt` for the expected filenames (primary, light, icon, SVG). Once the logo file is added as `assets/frame-africa-logo.png`, the image reference at the top of this document will render.

---

*Document owner: Frame Africa · Prepared for planning and development reference.*

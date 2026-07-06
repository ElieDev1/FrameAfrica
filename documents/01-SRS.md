# Frame Africa — Software Requirements Specification (SRS)

**Document:** 01 — SRS
**Version:** 1.0
**Status:** Draft for review
**Related:** `00-System-Overview.md`, `05-Security-Design.md`

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the complete functional and non-functional requirements for **Frame Africa**, a digital newspaper platform. It is the reference against which the system is designed, built, and tested.

### 1.2 Scope
Frame Africa is a web and mobile news platform that lets journalists produce content through a governed editorial workflow, lets readers discover and consume that content in multiple languages, and lets the organization earn revenue via subscriptions, advertising, and public notices. The system covers the public website, the reader account experience, the editorial CMS, the admin dashboard, and supporting services (search, notifications, payments, analytics, AI assistance).

### 1.3 Definitions
| Term | Meaning |
|---|---|
| CMS | Content Management System — the newsroom back office |
| PWA | Progressive Web App |
| RBAC | Role-Based Access Control |
| MoMo | MTN Mobile Money |
| SEO | Search Engine Optimization |
| SLA | Service-Level Agreement |
| WCAG | Web Content Accessibility Guidelines |

### 1.4 References
Rwanda Law N° 058/2021 on Protection of Personal Data and Privacy; Rwanda Media Commission guidelines; OWASP ASVS; WCAG 2.1 AA.

---

## 2. Overall Description

### 2.1 Product perspective
Frame Africa is a new, self-contained platform composed of a **Next.js frontend**, a **Node.js (NestJS) backend API**, a **PostgreSQL** database, a **search service**, **object storage** for media, and integrations for **payments, push notifications, and AI**.

### 2.2 User classes
| Class | Description | Technical skill |
|---|---|---|
| Visitor | Unauthenticated reader | Low |
| Registered Reader | Account holder, may subscribe | Low |
| Journalist / Reporter | Creates content | Medium |
| Sub-editor | Copy-edits content | Medium |
| Photographer / Videographer | Manages media | Medium |
| Editor | Approves & publishes | Medium |
| Community Moderator | Moderates comments | Medium |
| Ad / Sales Manager | Manages ads & notices | Medium |
| Administrator | Full system control | High |

### 2.3 Operating environment
Modern browsers (Chrome, Firefox, Edge, Safari), Android and iOS devices, and low-bandwidth network conditions. Cloud-hosted, containerized deployment.

### 2.4 Constraints
- Built with Next.js and Node.js.
- Must comply with Rwandan data-protection law.
- Must function on low-bandwidth mobile connections.
- Must support English and Kinyarwanda at launch.

### 2.5 Assumptions & dependencies
Reliable cloud hosting; availability of MoMo/Airtel payment APIs; third-party AI service or self-hosted models for AI features; email/SMS gateways.

---

## 3. Functional Requirements

Requirements are identified as **FR-<area>-<n>** and prioritized **M** (Must), **S** (Should), **C** (Could).

### 3.1 Authentication & Accounts
| ID | Requirement | Pri |
|---|---|---|
| FR-AUTH-1 | Users can register with email and verify via email link | M |
| FR-AUTH-2 | Users can log in/out with email + password | M |
| FR-AUTH-3 | Users can log in with Google and Apple (OAuth) | S |
| FR-AUTH-4 | Users can log in with phone number + OTP | S |
| FR-AUTH-5 | Users can reset a forgotten password | M |
| FR-AUTH-6 | Staff accounts require two-factor authentication | M |
| FR-AUTH-7 | Sessions expire and can be revoked; refresh tokens rotate | M |
| FR-AUTH-8 | Users can export their data and delete their account | M |

### 3.2 Content Consumption (Reader)
| ID | Requirement | Pri |
|---|---|---|
| FR-READ-1 | Visitors can browse and read published articles without login | M |
| FR-READ-2 | Readers can search by keyword, author, category, and date | M |
| FR-READ-3 | Readers can view images, galleries, video, and audio | M |
| FR-READ-4 | Readers can share articles to social platforms | M |
| FR-READ-5 | Registered readers can bookmark and keep reading history | S |
| FR-READ-6 | Readers can follow categories and receive alerts | S |
| FR-READ-7 | Readers can switch language (EN/RW/FR) | M |
| FR-READ-8 | Readers can use a low-bandwidth/data-saver mode | S |
| FR-READ-9 | Readers can read saved articles offline (PWA) | C |

### 3.3 Content Production (Journalist)
| ID | Requirement | Pri |
|---|---|---|
| FR-PROD-1 | Journalists can create, save drafts, and edit their own articles | M |
| FR-PROD-2 | Journalists can upload images, video, audio, and documents | M |
| FR-PROD-3 | Journalists can set category, tags, SEO fields, and references | M |
| FR-PROD-4 | Journalists can log subject-contacted / right-of-reply | S |
| FR-PROD-5 | Journalists can submit an article for review | M |
| FR-PROD-6 | Every save creates a tracked revision | M |

### 3.4 Editorial Workflow (Editor)
| ID | Requirement | Pri |
|---|---|---|
| FR-EDIT-1 | Editors can review, approve, reject, or edit submissions | M |
| FR-EDIT-2 | Editors can publish immediately or schedule publication | M |
| FR-EDIT-3 | Editors can set/clear an embargo time | S |
| FR-EDIT-4 | Editors can feature stories as breaking news | M |
| FR-EDIT-5 | Editors can publish a correction/retraction with a public log | M |
| FR-EDIT-6 | Editors can assign reporters and manage the editorial calendar | S |
| FR-EDIT-7 | Editors can archive articles | M |

### 3.5 Comments & Community
| ID | Requirement | Pri |
|---|---|---|
| FR-COMM-1 | Registered readers can comment and reply (threaded) | M |
| FR-COMM-2 | Readers can like and report comments | M |
| FR-COMM-3 | AI pre-screens comments for spam/abuse | S |
| FR-COMM-4 | Moderators can hide, remove, and ban; actions are logged | M |

### 3.6 Notifications & Newsletter
| ID | Requirement | Pri |
|---|---|---|
| FR-NOTIF-1 | System sends breaking-news and personalized alerts | M |
| FR-NOTIF-2 | Channels: email, web push, mobile push, optional SMS | M |
| FR-NOTIF-3 | Readers manage notification preferences and quiet hours | S |
| FR-NEWS-1 | Readers subscribe/unsubscribe to daily/weekly/category newsletters | M |
| FR-NEWS-2 | System tracks open/click rates and handles bounces | S |

### 3.7 Monetization
| ID | Requirement | Pri |
|---|---|---|
| FR-SUB-1 | Metered paywall: N free articles per period, then prompt to subscribe | M |
| FR-SUB-2 | Monthly & annual plans, student discount, invoices | M |
| FR-SUB-3 | Payment via MoMo, Airtel Money, and card in RwF | M |
| FR-AD-1 | Serve banner, video, native, and sponsored ads with AdSense | M |
| FR-AD-2 | Ad campaign management, click tracking, revenue reports | S |
| FR-AD-3 | Public notices / tenders / obituaries as a paid section | S |

### 3.8 Administration & Analytics
| ID | Requirement | Pri |
|---|---|---|
| FR-ADM-1 | Admins manage users, roles, and permissions (RBAC) | M |
| FR-ADM-2 | Admins manage categories, homepage layout, ads, newsletters | M |
| FR-ADM-3 | Admins view analytics (traffic, engagement, revenue, health) | M |
| FR-ADM-4 | Admins run and restore backups; configure system settings | M |
| FR-ADM-5 | All privileged actions are audit-logged | M |

### 3.9 AI Assistance
| ID | Requirement | Pri |
|---|---|---|
| FR-AI-1 | Suggest summaries, headlines, and tags for drafts | S |
| FR-AI-2 | Assist translation across supported languages | S |
| FR-AI-3 | Detect plagiarism and flag potential misinformation | S |
| FR-AI-4 | Power the recommendation engine and text-to-speech | C |
| FR-AI-5 | AI output is advisory; a human always approves publication | M |

### 3.10 Live News
| ID | Requirement | Pri |
|---|---|---|
| FR-LIVE-1 | Editors run live blogs with real-time updates | S |
| FR-LIVE-2 | Live score/election tickers update without page reload | S |

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-PERF-1** Homepage First Contentful Paint < 2 s on a 3G connection.
- **NFR-PERF-2** Search results returned < 1 s (p95).
- **NFR-PERF-3** API responses < 300 ms (p95) for read endpoints.
- **NFR-PERF-4** Images served as WebP/AVIF with responsive sizes and lazy loading.

### 4.2 Scalability
- **NFR-SCAL-1** Horizontally scalable stateless API behind a load balancer.
- **NFR-SCAL-2** CDN edge caching for anonymous traffic.
- **NFR-SCAL-3** Auto-scaling to absorb breaking-news spikes (phase toward 100k concurrent).

### 4.3 Availability & Reliability
- **NFR-AVAIL-1** Uptime ≥ 99.9% at launch, target 99.99% at scale.
- **NFR-AVAIL-2** Automated daily backups + weekly full backups; point-in-time recovery.
- **NFR-REL-1** No committed data loss; database transactions are ACID.

### 4.4 Security
Governed by `05-Security-Design.md`. Summary: HTTPS everywhere, hashed passwords (Argon2/bcrypt), 2FA for staff, RBAC, OWASP Top-10 mitigations, audit logging, and Rwandan data-protection compliance.

### 4.5 Usability & Accessibility
- **NFR-UX-1** Mobile-first, consistent layout, dark-mode native.
- **NFR-A11Y-1** WCAG 2.1 AA: keyboard nav, screen-reader support, alt text, captions, contrast, adjustable fonts.

### 4.6 Maintainability
- **NFR-MAINT-1** Modular, documented codebase with automated tests (≥ 70% coverage on core logic).
- **NFR-MAINT-2** Versioned APIs; staging environment with preview links; CI/CD.

### 4.7 Compatibility
Latest two versions of Chrome, Firefox, Edge, Safari; Android 9+; iOS 14+; tablet & desktop.

### 4.8 SEO
Schema.org `NewsArticle`, XML + Google News sitemaps, canonical URLs, Open Graph, Twitter Cards, breadcrumbs, `hreflang`.

### 4.9 Compliance
Privacy policy, cookie consent, terms of service, copyright management, and Rwanda Law N° 058/2021 compliance including data export and erasure.

---

## 5. Acceptance Criteria (samples)

- A visitor can find and read a published article in under three clicks from the homepage.
- A journalist's submitted article cannot appear publicly until an editor approves it.
- A correction added to a published article is visible to readers with a timestamp.
- A subscriber paying with MoMo receives access and an invoice within one minute.
- A failed login lockout and audit-log entry occur after repeated bad attempts.

---

## 6. Traceability

Each FR/NFR maps forward to a design element (`02`–`06`), a use case (`07`), and a test case (`08`). The traceability matrix is maintained in `08-Test-Deployment.md`.

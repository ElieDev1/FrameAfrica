# Frame Africa — UI/UX & Content Layout

**Document:** 06 — UI/UX & Content Layout
**Version:** 1.0
**Principle:** Mobile-first, content-first, fast, and accessible.

---

## 1. Design Philosophy

Frame Africa is a **news product**, so the design serves reading above all: clear hierarchy, generous typography, fast loading, and calm layouts that let stories breathe. The brand is bold and pan-African (dark canvas, warm orange accent), but the reading surface stays clean and high-contrast.

**Five rules**
1. **Content first** — the story is the hero; chrome recedes.
2. **Hierarchy** — size, weight, and position signal importance at a glance.
3. **Consistency** — the same component behaves the same everywhere.
4. **Speed is UX** — perceived performance is a design feature (skeletons, lazy media).
5. **Access for all** — works on cheap phones, slow networks, and with assistive tech.

## 2. Brand & Design Tokens

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0A0A0A` | App background (dark) |
| `--color-surface` | `#161616` | Cards, nav, panels |
| `--color-primary` | `#F39200` | Links, CTAs, active state ("Africa" orange) |
| `--color-accent-red` | `#E2231A` | Breaking-news badge |
| `--color-accent-yellow`| `#FFC20E` | Highlights |
| `--color-accent-green` | `#2E7D32` | Success, live indicator |
| `--color-text` | `#FFFFFF` | Primary text on dark |
| `--color-muted` | `#B0B0B0` | Metadata, captions |
| `--radius` | `12px` | Cards/buttons |
| `--font-heading` | Archivo (weights 400–900) | Headlines, kickers, UI labels |
| `--font-body` | Source Serif 4 | Article body, deks |
| `--font-mono` | IBM Plex Mono | Metadata, timestamps, badges, bylines |

**Light mode** mirrors these with a white canvas; theme is user-toggleable and respects system preference.

**Type scale** (fluid): `12 · 14 · 16(body) · 18 · 22 · 28 · 36 · 48`. Body line-height ~1.6; measure ~66–75 characters for article text.

## 3. Information Architecture (site map)

```
Home
├── Sections (nested categories)
│   ├── Rwanda · Africa · World · Politics
│   ├── Business · Economy · Technology
│   ├── Health · Education · Agriculture · Environment
│   ├── Sports · Entertainment · Lifestyle · Tourism
│   └── Opinion · Investigations · Fact Check
├── Live (live blogs / tickers)
├── Video / Podcasts
├── Notices (Tenders · Obituaries · Public notices)
├── Search
├── Newsletters
├── Subscribe (plans / paywall)
├── About · Contact · Careers · Tips (secure)
└── Account
    ├── Profile · Bookmarks · Reading history
    ├── Followed categories · Notifications
    └── Subscription & invoices
```

**Navigation model**
- **Top bar**: logo, primary sections (overflow into "More"), search, language switcher, subscribe CTA, account.
- **Mobile**: sticky compact header + hamburger drawer; bottom tab bar optional (Home, Sections, Search, Saved, Account).
- **Breadcrumbs** on article/section pages for orientation and SEO.
- **Footer**: full section index, company links, legal (privacy, terms, cookies), social.

## 4. Key Page Layouts

### 4.1 Homepage
Priority order top to bottom:
```
┌───────────────────────────────────────────────┐
│ Breaking-news ticker (only when active)        │
├───────────────────────────────────────────────┤
│ HERO: lead story (large image, headline, dek)  │
│         + 2–3 secondary headlines beside it     │
├───────────────────────────────────────────────┤
│ Latest news (river)      │  Sidebar:            │
│  - card, card, card ...   │  • Most read (1–5)   │
│                           │  • Editor's picks    │
│                           │  • Newsletter signup │
│                           │  • Weather / markets │
├───────────────────────────────────────────────┤
│ Section blocks: Politics · Business · Sports…   │
│ (each = mini-header + 3–4 cards)                │
├───────────────────────────────────────────────┤
│ Video / Podcast strip (horizontal scroll)      │
├───────────────────────────────────────────────┤
│ Ad slot (clearly labeled) · Footer             │
└───────────────────────────────────────────────┘
```
Ads are always labeled "Advertisement" and never mimic editorial cards.

### 4.2 Article page (the most important layout)
```
Breadcrumb: Home › Section › Article
H1 Headline
Subtitle / dek
By Author · Section · Date · Read time · [Listen ▶ TTS]
Featured image (with credit + caption)
────────────────────────────────────────────
Body (single readable column, ~680px):
  • paragraphs, subheads, pull quotes
  • inline images/galleries, video, embeds
  • references / sources block
  • [Correction/Update notice if any — dated]
────────────────────────────────────────────
Tags · Share bar (sticky on mobile)
Author bio card (photo, bio, follow)
Related articles (3–4)
Comments (threaded, load-on-demand)
[Paywall prompt appears here if premium + over meter]
```
Reading aids: reading-progress bar, adjustable font size, dark/light, print-friendly view, save/bookmark.

### 4.3 Section / category page
Section masthead → lead story → card river with load-more/pagination → optional sub-category filter chips → sidebar (most read in section).

### 4.4 Search results
Query box with filters (date, section, author, media type) → result list with highlighted matches → suggestions/trending when empty.

### 4.5 CMS editor (newsroom)
Distraction-free rich-text editor · left rail: status, category, tags, SEO, schedule/embargo · right rail: media library, revision history, AI suggestions (summary/headline/tags) · top: workflow actions (Save, Submit, Preview link).

### 4.6 Admin dashboard
KPI cards (visitors, subscribers, revenue, articles today, pending comments, system health) → charts → quick tables (recent articles, flagged comments) → left nav to management sections.

## 5. Component Library (design system)

| Component | Notes |
|---|---|
| Article card (S/M/L) | Image, kicker, headline, meta; consistent everywhere |
| Kicker/badge | Section tag, "Breaking", "Live", "Premium" |
| Byline block | Author, date, read time, listen button |
| Share bar | Native share + platform buttons; sticky on mobile |
| Media embed | Responsive image, gallery, video, audio player |
| Comment thread | Nested replies, like, report, moderation state |
| Paywall prompt | Meter counter → plans → pay (MoMo/Airtel/card) |
| Newsletter box | Inline + modal variants |
| Toast/alert | Non-blocking feedback |
| Skeleton loaders | For every async block |

All components are **themeable** via tokens and shipped as reusable React components.

## 6. Content Hierarchy & Editorial Layout Rules

- **One H1 per page** (the headline); subheads use H2/H3 in order.
- **Kicker → Headline → Dek → Byline** is the fixed top pattern.
- Lead paragraph carries the "who/what/where/when" for scanners.
- Images always have **alt text**, **caption**, and **credit**.
- Pull quotes and subheads break long reads every few paragraphs.
- Related links are contextual, not random; boost internal linking for SEO.
- Corrections appear **inline and dated** — never silently edited.

## 7. Responsive Strategy

| Breakpoint | Layout |
|---|---|
| < 640px (mobile) | Single column, stacked, bottom nav, sticky share |
| 640–1024px (tablet) | Two-column where useful; drawer nav |
| > 1024px (desktop) | Multi-column home, sidebar, wide media |

Mobile-first CSS; content reflows, never horizontally scrolls; tap targets ≥ 44px.

## 8. Performance-as-UX

- Skeleton screens and optimistic UI for perceived speed.
- Images: responsive `srcset`, WebP/AVIF, lazy-loaded, blur-up placeholders.
- Above-the-fold content prioritized; defer non-critical JS.
- **Data-saver mode**: smaller images, deferred embeds, text-first — for low-bandwidth users across Africa.
- Offline reading via PWA for saved articles.

## 9. Accessibility (WCAG 2.1 AA)

- Color contrast ≥ 4.5:1 for text; state not conveyed by color alone.
- Full keyboard operability; visible focus rings; logical tab order.
- Semantic HTML + ARIA where needed; landmarks for screen readers.
- Alt text on images; captions/transcripts for video and audio.
- Adjustable font size; respects reduced-motion preference.
- Forms have labels, clear errors, and instructions.

## 10. Multilingual UX

- Language switcher in header (EN · RW · FR · optional SW).
- Locale-aware dates, numbers, and reading direction (all LTR here).
- Translated articles linked via a language selector on the article itself.
- Kinyarwanda and French get first-class typography and full UI translation.

## 11. Trust & Transparency UI

- Clear author identity and bios; verified staff badges.
- Visible publish and update timestamps.
- Prominent, honest labeling of ads and sponsored content.
- Accessible corrections page and per-article correction notices.
- Easy, discoverable secure-tips and contact options.

## 12. Interactive Design Prototype

A clickable, self-contained HTML prototype covering Homepage, Article, Category, Search,
CMS Editor, Admin, and a component-library screen (with desktop/mobile and dark/light
toggles) lives in [`documents/design-prototype/`](design-prototype/Frame%20Africa.dc.html).
It is the visual reference this document's layouts describe — open the `.dc.html` file
directly in a browser to explore.

---

*Layouts map to the routes in `02-System-Architecture.md` and the endpoints in `04-API-Design.md`; accessibility and labeling requirements trace to `01-SRS.md`.*

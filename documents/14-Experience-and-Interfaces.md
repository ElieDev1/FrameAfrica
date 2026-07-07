# Frame Africa — Experience & Interface Design

**Document:** 14 — Experience & Interfaces
**Version:** 1.0
**Status:** Active design reference.
**Related:** `13-Product-Plan.md` (roles, content model, Definition of Done), `06-UIUX-Content-Layout.md` (layouts/tokens), `01-SRS.md` (requirements), `04-API-Design.md` (endpoints)

---

## 0. Purpose

`13-Product-Plan.md` says **who** builds and **what a story is**. This document says
**what people see and do** — in detail — on both sides of the paper:

- **Front of house:** every visitor/reader surface, mapped to the newsroom activity
  that produces it, and everything a reader can *respond to* (comment, reply, like,
  share, follow…).
- **Media:** how **YouTube video is pulled in automatically** (no manual DB entry),
  plus galleries, audio/podcasts.
- **Advertising:** an **advanced** ad system (IAB units, direct + programmatic +
  native, targeting, notices).
- **Taxonomy:** the real section / sub-section / topic structure.
- **Back of house:** the **staff dashboard UX** — a collapsible sidebar (full ↔
  icons-only), a topbar with **notifications + profile + global search + quick create**,
  and advanced data-display patterns.

It is deliberately thorough — it doubles as the build checklist for the front-end and
the interface layer.

---

## 1. Visitor surfaces — office output → what the reader sees

Every public surface is the *output* of a newsroom activity. If the office does it,
the reader sees it.

| Newsroom activity | Public surface the reader gets |
|---|---|
| A reporter publishes a story | **Article page** (rich document) + it appears in Home/Section/Topic feeds, search, RSS, newsletter |
| Editor curates the front page | **Homepage** (lead, secondary, section blocks, widgets) |
| Editor runs live coverage of an event | **Live page** with real-time updates |
| Editor corrects a story | inline **dated correction notice** + Corrections page |
| Photographer builds a gallery | **Photo gallery** page + inline galleries in articles |
| Videos posted to the YouTube channel | **Video hub** + homepage "Watch" strip (auto-synced, §3) |
| Audio desk publishes a podcast | **Podcasts** page + episode players + "Listen" on articles |
| Sales books a notice/tender/obituary | **Notices** section pages |
| Sales runs a campaign | **Ad slots** across the site (§4) |
| Audience desk sends a newsletter/alert | **Newsletter** archive + email/push/WhatsApp |

### 1.1 Surface catalogue (what each page shows)

- **Home** — breaking ticker; **lead** + secondary headlines; **Latest** river;
  **section blocks**; **Watch & Listen** strip; sidebar (Most read · Editor's picks ·
  Weather · Markets · Newsletter); labelled ad slots; **Live** module when active.
- **Section** (`/section/[slug]`) — masthead + description; lead story; card river with
  **load-more**; **sub-section filter chips**; section sidebar (most-read-in-section);
  section-specific ad. *(Missing today — see `13`.)*
- **Sub-section** — same as section, scoped.
- **Topic / Tag** (`/topic/[slug]`) — a followable subject page (e.g. "Elections
  2027"), with a **Follow** button, description, and its stories.
- **Article** (`/article/[slug]`) — kicker · headline · standfirst · **linked byline** +
  photo · published **& "Updated"** timestamps · read time · **Listen (TTS)** · hero
  media (caption+credit) · **rich body** (subheads, inline captioned photos, galleries,
  pull quotes, fact-boxes, embeds) · **tags** · **sources** · **correction notice** ·
  **reading-progress bar** · **sticky share bar (mobile)** · **author bio card** ·
  related stories · **comments**. Premium → paywall preview.
- **Live** (`/live/[slug]`) — LIVE badge, "Updated Xm ago", pinned summary, **real-time
  entry stream** (newest first), key-events rail.
- **Author** (`/author/[slug]`) — photo, bio, role, **Follow**, their stories.
- **Video hub** (`/videos`) — grid from the YouTube channel (auto-synced, §3), playlists.
- **Podcasts** (`/podcasts`) — shows/episodes + player + subscribe (RSS/Spotify/Apple).
- **Photo galleries** (`/galleries`) — visual stories.
- **Notices** (`/notices`) — Tenders · Obituaries · Public notices · Announcements · Jobs.
- **Search** (`/search`) — query + **filters** (date, section, author, media type) +
  highlighted matches + trending/suggestions when empty.
- **Newsletters** (`/newsletters`) — list + subscribe + archive.
- **Subscribe / paywall** (`/subscribe`) — plans, benefits, MoMo/Airtel/card.
- **Static / trust** — About, Contact, Careers, **Secure Tips**, Editorial Standards,
  Corrections, Privacy, Terms, Cookies, `ads.txt`.
- **Account** (reader) — profile, **bookmarks**, **reading history**, **followed
  sections/topics/authors**, notification prefs, subscription & invoices.

---

## 2. Reader engagement — what a visitor can *do*

| Action | Who | Login? | Notes |
|---|---|---|---|
| Read published stories | anyone | no | metered paywall on premium (`FR-SUB-1`) |
| **Comment** | reader | **yes** | plain-text, sanitised (`05` §6), AI/spam pre-screen (`FR-COMM-3`) |
| **Reply** (threaded) | reader | yes | one+ level threads |
| **Like** an article | reader | yes | per-user, de-duplicated |
| **Like** a comment | reader | yes | surfaces top comments |
| **Report / flag** a comment | reader | yes | routes to moderation queue |
| **Share** | anyone | no | native share + X · Facebook · **WhatsApp** · LinkedIn · Email · **Copy link** |
| **Bookmark / Save** | reader | yes | in Account (`FR-READ-5`) |
| **Follow** section / topic / author | reader | yes | drives a "For you" feed + alerts (`FR-READ-6`) |
| **Reading history** | reader | yes | auto-recorded; managed in Account |
| **Listen (TTS)** | anyone | no | "Listen to this article" (`FR-AI-4`) |
| **Adjustable font size / print** | anyone | no | reading aids (`06 §4.2`) |
| **Subscribe to newsletter** | anyone | email only | double opt-in |
| **Enable alerts** (breaking) | reader | yes | push / email / **WhatsApp** (`FR-NOTIF`) |
| **Gift / unlock an article** | subscriber | yes | share a paywalled story (industry-standard) |
| **Submit a tip** | anyone | no | **secure, no-tracking** channel (`05 §11`) |
| **Subscribe (pay)** | reader | yes | MoMo / Airtel / card, RwF (`FR-SUB-3`) |

**Moderation contract:** every reader-generated item (comment, report) has a `status`
and is actionable by a Moderator; abusive users can be banned; all moderator actions
are audit-logged (`13 §4.5`).

---

## 3. Media & video

### 3.1 YouTube — automatic, no manual DB entry

**Requirement:** all videos we post to YouTube appear on the site automatically,
without anyone re-entering them.

**How it works** (YouTube Data API v3):

1. Configure the **channel** (or specific **playlist**) IDs once, in settings/env.
2. A **scheduled sync job** resolves the channel's **uploads playlist**
   (`channels.list` → `contentDetails.relatedPlaylists.uploads`) and pages through
   `playlistItems.list` to get every uploaded video (id, title, description,
   thumbnails, `publishedAt`, duration via `videos.list`).
3. Store only a **lightweight cache** (video id + metadata + which playlist/section) —
   **not the video** — refreshed every N minutes; quota-aware with `nextPageToken`.
4. The **Video hub** and homepage **Watch** strip render from this cache. New uploads
   appear automatically on the next sync; deletions/unlists drop out.
5. **Embeds** use `youtube-nocookie.com`, responsive 16:9, lazy-loaded (privacy + perf).
6. **In-article video:** a journalist pastes a YouTube URL into a `video`/`embed`
   block; we resolve it via **oEmbed** and render the player — again no manual metadata.
7. Editors may **map playlists → sections** (e.g. "Sports highlights" playlist →
   Sport/Video) and **feature/pin** specific videos; otherwise it's all automatic.

*Same pattern generalises to other embeds (X, Instagram, TikTok, SoundCloud) via an
allow-listed oEmbed resolver (`05 §7` CSP-safe).*

### 3.2 Galleries, audio & live video
- **Photo galleries** from the media library (§`13 §5`) — swipeable, captions+credits.
- **Podcasts/audio** — episode player, "Listen to this article" TTS, podcast RSS.
- **Live video** — embed a YouTube/HLS live stream on a Live page during events.

---

## 4. Advanced advertising

A real ad system, not just a labelled box. (IAB standard units + IAB New Ad Portfolio
flexible ratios.)

### 4.1 Ad units & placements

| Unit | Size(s) | Placement |
|---|---|---|
| Leaderboard / Super / **Billboard** | 728×90 · 970×90 · **970×250** | top of page, between sections |
| **MPU / Medium Rectangle** | 300×250 · 336×280 | in-content, sidebar |
| **Half-page (sticky)** | 300×600 | sidebar, sticky on scroll (high viewability) |
| Mobile banner | 320×50 · 320×100 | mobile top/inline |
| **In-article native** | fluid | between paragraphs, styled as content **but clearly labelled** |
| Sticky footer / anchor | responsive | mobile bottom (dismissible) |
| Interstitial | full | sparingly, frequency-capped |
| **Video pre-roll** | — | before video content |
| **Sponsored content / advertorial** | article-shaped | labelled "Sponsored", separate template |

### 4.2 Ad sources (in priority order)
1. **Direct-sold** — advertiser → campaign → creative → **flight** (dates, budget,
   targeting) → served with **click/impression tracking** (`03 §3.10`).
2. **House ads** — promote our own subscriptions/newsletters when nothing is sold.
3. **Programmatic** — Google AdSense / Ad Manager fallback fill.
4. **Notices as ads** — Tenders · Obituaries · Public notices, sold and scheduled into
   the **Notices** section (a real Rwandan revenue line, `FR-AD-3`).

### 4.3 Targeting, governance & performance
- **Targeting:** section/topic, geo, device, day-part, logged-in vs anon; **frequency
  capping**; A/B creatives.
- **Governance:** every ad **labelled** ("Advertisement" / "Sponsored"); `ads.txt`;
  **no ads** on Tips/sensitive/error pages; slots **reserve space** (no layout shift);
  ad-block **detection + graceful** message; sponsored never mimics editorial (`06 §4.1`).
- **Performance:** impressions, viewable impressions, clicks, CTR, revenue — per
  campaign/creative, in the **Sales dashboard**; `05 §7` CSP allow-list for ad hosts.

---

## 5. Taxonomy — sections, sub-sections & topics

One **primary section** per article (nested, admin-managed) + many **topics/tags**
(followable, own pages) + editorial **collections/series**.

### 5.1 Sections (recommended launch tree)

| Section | Sub-sections |
|---|---|
| **News** | Rwanda (National) · Kigali · East Africa · Africa · World · Politics · Diplomacy · Crime & Justice |
| **Business** | Economy · Markets · Companies · Banking & Finance · Agribusiness · Startups & Tech · Real Estate · Personal Finance |
| **Technology** | Mobile · Internet · AI · Fintech · Gadgets |
| **Sport** | Football · Athletics · Basketball · Cycling · Volleyball · Motorsport · More |
| **Health** | Public Health · Wellness · Medicine |
| **Education** | Schools · Higher Education · Skills |
| **Environment & Climate** | Climate · Conservation · Energy |
| **Agriculture** | Crops · Livestock · Agri-tech |
| **Science** | — |
| **Opinion** | Editorials · Op-Eds · Columns · Letters · Cartoons |
| **Culture & Life** | Arts · Music · Film & TV · Books · Food & Drink · Fashion · Travel & Tourism · Lifestyle · Religion |
| **Investigations** | — |
| **Fact Check** | — |
| **Live** | (live coverage) |
| **Multimedia** | Video · Podcasts · Photo galleries · Data & Interactives |
| **Notices** | Tenders · Obituaries · Public notices · Announcements · Jobs |

### 5.2 Topics & collections
- **Topics/tags:** followable subjects with their own pages (people, places, orgs,
  events) — e.g. _Kigali_, _AfCFTA_, _RwandAir_, _Elections 2027_, _Climate_.
- **Collections / series:** editor-curated sets (e.g. "The Kivu Files" investigation),
  shown as a branded strip on member articles.

---

## 6. Staff dashboard — interface design

The back office is an **app**, not the reader site (`13 §7`). Its shell:

### 6.1 Layout

```
┌──────────────────────────────────────────────────────────┐
│ TOPBAR: [≡ toggle] brand │ ⌘K search │ ＋New │ 🔔 │ 👤 │  │
├────────────┬─────────────────────────────────────────────┤
│  SIDEBAR   │  Breadcrumb › Page title            [actions]│
│ (collapsible│                                             │
│  full↔icons)│  PAGE CONTENT (tables / cards / editor …)   │
│  grouped,  │                                             │
│  role-aware│                                             │
└────────────┴─────────────────────────────────────────────┘
```

- **Collapsible sidebar** — expanded (~240px, icon+label, grouped) ↔ **collapsed
  (~64px, icons-only)**; the toggle is in the topbar, the state is **persisted**
  (cookie/localStorage), and **collapsed items show a tooltip on hover**. On mobile the
  sidebar becomes an **overlay drawer**.
- **Role-aware, grouped nav** (per `13 §7`) — Newsroom (Overview, Stories, New, Live,
  Studio), Desk (Review, Assignments, Calendar) for editors, Community (Moderation) for
  moderators, Sales (Campaigns, Notices), Administration (Users & roles, Taxonomy,
  Settings, Audit) for admins.

### 6.2 Topbar (always present)
- **Sidebar toggle** (≡) + brand mark.
- **Global search / command palette (⌘K)** — jump to any story/section/user/action.
- **Quick create (＋ New)** — New story · New notice · Upload media · New live.
- **🔔 Notifications bell** — unread **badge count**, dropdown of recent items (grouped,
  relative time), **mark read / mark all**, "See all" → notifications center. Updates in
  **real time** (SSE).
- **👤 Profile menu** — avatar → name + role, **My account**, **Theme** (light/dark),
  Help/shortcuts, **Sign out**. (Also a "View site" link.)

### 6.3 Notifications system

In-app + email + optional push, driven by role-relevant events:

| Event | Notified |
|---|---|
| A story is **assigned to you** | reporter |
| Your story is **submitted / approved / rejected / published** | reporter / editor |
| A story is **submitted for review** | editors |
| A **new comment** needs moderation / was **reported** | moderators |
| A **new tip** arrives | assigned editors |
| A **campaign/notice** needs action | sales |
| **@mention** in an editorial note | mentioned user |
| **System** (publish failure, backup, security) | admins |

Preferences per channel/type in Account. Real-time badge via SSE (`04 §11`).

### 6.4 Advanced display patterns (how content is shown)

- **Data tables** — sortable columns, **filter bar**, **saved views**, pagination,
  **bulk-select actions**, adjustable density, empty/loading (**skeleton**) states.
- **Status chips** — draft / in-review / scheduled / published / rejected, colour-coded.
- **KPI stat cards** + **charts** (traffic, revenue, funnel) — real data (`13 §8`).
- **Editorial pipeline board (kanban)** — drag stories across workflow states.
- **Editorial calendar** — schedule/embargo view.
- **Detail side-panels / drawers** — act without leaving the list.
- **Toasts** for feedback; **confirm dialogs** for destructive actions.
- **Keyboard shortcuts** + full accessibility; responsive down to tablet, drawer on phone.

---

## 7. Cross-cutting (the things you didn't name but we need)

- **Notifications center** (in-app history) — §6.3, mirrored for readers (alerts).
- **Personalisation** — follow → "For you" feed + alerts (`FR-READ-6`).
- **Internationalisation** — real **EN / Kinyarwanda / French** switcher, per-article
  language variants, `hreflang` (`FR-READ-7`, `06 §10`).
- **Accessibility** — WCAG 2.1 AA, keyboard, alt/captions, contrast, **adjustable font**,
  reduced motion, dark/light (`06 §9`).
- **PWA / offline / data-saver** — installable, saved-article offline reading, low-data
  mode for African connectivity (`FR-READ-8/9`).
- **Trust surfaces** — Corrections page, **fact-check labels**, right-of-reply logging,
  secure Tips, Editorial Standards/About (`05 §13`, `06 §11`).
- **Social graphics** — promo cards/flyers made in the **Studio** (`13 §6`) and pushed
  to social/WhatsApp; Open Graph/Twitter cards auto-generated per article.
- **Real-time analytics** for editors (who's-reading-now, referrers, scroll/completion).
- **SEO/distribution** — `NewsArticle` schema, XML + **Google News** sitemap, RSS per
  section/topic, AMP-optional, canonical/`hreflang`.
- **Privacy/consent** — cookie consent, privacy center, data export/erasure
  (`FR-AUTH-8`, Rwanda Law N° 058/2021).

---

## 8. Research notes & sources

- **YouTube auto-sync:** a channel's uploads are a **playlist**; resolve the uploads
  playlist from the channel resource, then page `playlistItems.list` — the documented
  way to pull all of a channel's videos and keep a site synced without manual embedding.
- **Ad units:** the IAB standard units (728×90 Leaderboard, 300×250 MPU, **300×600
  half-page — strong as a sticky unit**, 970×250 Billboard, 336×280) and the **IAB New
  Ad Portfolio** (native + flexible aspect ratios across screens) are the basis for §4.

**Sources:**
- [PlaylistItems: list — YouTube Data API](https://developers.google.com/youtube/v3/docs/playlistItems/list)
- [Implementation: Playlists — YouTube Data API](https://developers.google.com/youtube/v3/guides/implementation/playlists)
- [Retrieve videos from the YouTube Data API v3 (Node.js)](https://blog.tericcabrel.com/retrieve-videos-youtube-data-api-v3-nodejs/)
- [IAB Standards and IAB Standard Ad Sizes — Publift](https://www.publift.com/blog/iab-standards-for-publishers)
- [IAB New Ad Portfolio — IAB Tech Lab](https://iabtechlab.com/standards/iab-new-ad-portfolio-guidelines/)
- [Standard digital ad sizes 2026](https://zeely.ai/blog/standard-digital-ad-sizes/)

---

*This document is the interface + experience reference. When a surface, interaction,
media source, ad unit, taxonomy entry, or dashboard pattern changes, update it here and
in `12`/`13`.*

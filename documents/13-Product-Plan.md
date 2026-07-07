# Frame Africa — Product Plan (Roles, Content, Workflows & Definition of Done)

**Document:** 13 — Product Plan
**Version:** 1.1
**Status:** Active — this is how we build from here.
**Related:** `01-SRS.md` (requirements), `03-Database-Design.md` (data), `06-UIUX-Content-Layout.md` (design), `12-Delivery-Plan.md` (slice tracker)

---

## 0. Why this document exists

`12-Delivery-Plan.md` tracks _slices_. It let us move fast, but it also let us ship
**thin, disconnected features** and call them "done" — a comment box with no
moderation, an "article" that is a plain textarea, six shallow categories, an admin
account created with a database script. That is not a product people look at and say
_"this is a system."_

This document resets the approach. We build **complete workspaces around what each
person actually does**, on a **real content model** and a **real section taxonomy**,
to a written **Definition of Done** — including the things a modern newsroom expects
that weren't in the original brief: **live/developing coverage**, an in‑app **Studio**
for social graphics, and proper distribution.

**Three rules from now on**

1. **Complete verticals, not fragments.** A feature ships only when the whole job it
   serves works end to end — backend, UI, edge cases, real data.
2. **Build around jobs-to-be-done**, not "what CRUD can we expose?".
3. **No placeholders in shipped work** — no "coming soon" panels, fake data, or
   URL-paste standing in for uploads, inside a feature we call done.

---

## 1. Definition of Done (the bar for _every_ feature)

Done only when **all** hold:

- [ ] **The whole job works** end to end for a real user.
- [ ] **Backend + frontend** both real (no stubs, no hard-coded data).
- [ ] **Role-gated on the server** (never UI-only); object-level authZ where it applies.
- [ ] **All states**: loading, empty, error, unauthorized, success.
- [ ] **Responsive** (phone) and **accessible** (keyboard, labels, alt, contrast, focus).
- [ ] **Real content**: images upload, text is structured, numbers come from data.
- [ ] **Tested** (unit for logic; critical path verified end-to-end).
- [ ] **Secure** (input validated, output sanitised/encoded, no client-side secrets).
- [ ] **Documented** (`CHANGELOG` + relevant `documents/`).
- [ ] **No TODO/placeholder** in the shipped surface.

If any box is unchecked, it is **in progress**, not done.

---

## 2. The keystone — an article is a structured document

Today `article.body` is plain text split on blank lines with one cover image. Real
journalism is a **structured document**. This is rebuilt first; the editor, media,
SEO, Studio and reading experience all depend on it.

### 2.1 Anatomy

Kicker (section) · **Headline** (H1) · Standfirst/dek · Byline(s) linking to author
pages · Dateline + published **and visible "Updated"** timestamps · Hero media (image
_or_ video, with **caption + credit + alt**) · **Body = ordered blocks** (§2.2) ·
Sources/references · Tags/topics · **Corrections log** (dated, public) · Author bio.

### 2.2 Body block types (the content model)

Body = **validated, sanitised JSON** — an ordered array of typed blocks, rendered
server-side to semantic HTML, authored in a real block/rich-text editor:

| Block | Fields | Renders as |
|---|---|---|
| `paragraph` | rich inline (bold, italic, link) | `<p>` |
| `subheading` | text, level (H2/H3) | in-article **heading** |
| `image` | assetId, caption, credit, alt, alignment | figure + caption |
| `gallery` | assetIds[], caption | swipeable gallery |
| `pullquote` | text, attribution | pulled quote |
| `blockquote` | text, attribution | quotation |
| `list` | ordered/unordered, items[] | `<ul>`/`<ol>` |
| `factbox` | title, body (rich) | boxed explainer / **definition** aside |
| `embed` | provider, url (allow-listed) | responsive video/social embed |
| `divider` | — | section break |

Rules: JSON validated against a block schema on write; rich text **sanitised**
(allow-list) so no script persists (`05` §6); every image references a **media-library
asset** (§5) with **alt + credit** (blocked from publish otherwise); read-time and
excerpt are **derived**; SEO JSON-LD/OG generated from the structure.

> **"Headings"** live in two places, both handled: the article **headline +
> subheadings** (above), and **section/index headings** in navigation (the taxonomy, §3).

---

## 3. Section & topic taxonomy (the real one)

The seeded six categories are a placeholder. A real paper has a **two-level section
tree** plus cross-cutting **topics**. Sections are **admin-managed** (nested, per
`03` §3.3); one **primary section** per article, optional secondary sections.

**Sections (launch tree)**

- **News** → Rwanda (National) · East Africa · Africa · World · Politics ·
  Crime & Justice
- **Business** → Economy · Markets · Companies · Agribusiness · Personal Finance
- **Technology** · **Health** · **Education** · **Environment & Climate** ·
  **Agriculture** · **Science**
- **Sport** → Football · Athletics · Basketball · Cycling · Other
- **Opinion** → Editorials · Op-Eds · Columns · Letters · Cartoons
- **Culture & Life** → Arts · Music · Film & TV · Books · Food · Fashion ·
  Travel & Tourism · Lifestyle · Religion
- **Investigations** · **Fact Check**
- **Live** (live coverage, §4.1)
- **Multimedia** → Video · Podcasts · Photo galleries · Data & Interactives
- **Notices** → Tenders · Obituaries · Public notices · Announcements · Jobs

**Topics / tags** — separate from sections: followable subjects that get their **own
page** and can drive alerts (e.g. _Kigali_, _AfCFTA_, _Elections 2027_, _RwandAir_,
_Climate_, named people/places/organisations). This mirrors how real systems split
**sections** (structure, one primary) from **topics/tags** (many, followable). Needs a
`tag`/`topic` model + `article_tag` (`03` §3.4) and topic pages.

**Done when:** the taxonomy is admin-editable, articles carry a primary section +
topics, and every section and topic has a real index page.

---

## 4. Content types beyond the standard article

A newspaper is a **multi-format** publication. Each is a first-class content type:

### 4.1 Live coverage & developing stories  *(CNN-style — the one you called out)*
- **Live coverage:** a live event (`LiveBlog`) with a stream of timestamped
  **entries/key updates** (newest first), each authored, with its own blocks; a pinned
  summary; a **LIVE** badge; "Updated Xm ago"; entries **push in real time** to open
  readers (SSE/WebSocket, falling back to polling — `04` §11). Used for elections,
  matches, breaking events.
- **Developing story:** a flag on a normal article showing _"Developing — last updated
  {time}"_ with a visible **update log**, so readers _see it being updated_.
- Model: `live_blog` (parent) → `live_entry[]`; or `article.isDeveloping` + update log.
- **Done when:** an editor runs a live blog and readers watch entries appear without
  reloading; a developing article shows dated updates.

### 4.2 Notices (revenue) — tenders · obituaries · public notices · announcements · jobs
Own submission → pay → schedule → publish flow, in the **Notices** section
(`FR-AD-3`). A real Rwandan revenue line.

### 4.3 Multimedia — photo galleries · video · **podcasts / audio** · data & interactives
Galleries and video from the media library; podcast episodes with players;
**"Listen to this article" (text-to-speech)** for accessibility (`FR-AI-4`);
embeddable data visualisations/interactive graphics.

### 4.4 e-Paper / PDF edition
A daily digital replica (page-turn/PDF) — `FR` archive/e-paper (`01` §4.18). Later phase.

---

## 5. Foundations (build before role workspaces)

1. **Content model + editor + rendering** (§2) — keystone.
2. **Section & topic taxonomy** (§3) — admin-managed, real seed, index + topic pages.
3. **Media library** — real **upload** (S3-compatible/local dev), required
   **alt/credit/licence**, reusable assets, galleries, **focal-point crop + responsive
   variants** (WebP/AVIF), optional AI alt-text (`02` §5, `03` §3.7). Replaces
   URL-paste everywhere.

---

## 6. The Studio — in-app design for flyers, posters & social cards

> _"We should be able to create flyers for posting without using separate software."_

A built-in **Content Studio** so staff produce shareable graphics **inside** Frame
Africa — no Canva/Photoshop:

- **Templates** for common formats: social card (1200×630), Instagram/WhatsApp
  square (1080×1080) and story (1080×1920), **"Breaking news"** card, **quote card**,
  poster/flyer (A4/A3), section banner.
- **Brand kit:** locked logo, colours, fonts, aperture motif — everything on-brand by
  default.
- **Generate from an article:** one click pulls the **headline, hero image, section
  and byline** into a template; the designer tweaks text, swaps the image (from the
  media library), repositions, recolours within the brand kit.
- **Canvas editor:** text, images, shapes, backgrounds, layering — a focused
  Canva-lite (client canvas via a library such as Konva/Fabric, or a
  template + `satori`/`resvg` server render).
- **Export & reuse:** render to **PNG/JPG (and PDF for flyers)**, save to the media
  library, and **download or push to the social queue** for posting (incl. WhatsApp).
- **Roles:** used by reporters, editors, and a **Social/Audience editor** (§7).

**Done when:** someone opens Studio, generates a branded breaking-news card from a
live story, and downloads/queues it for social — start to finish, no external tool.

---

## 7. Roles & workspaces — who does what, when it's done

Each role gets a **workspace under `/dashboard`** built around their real day.

| Role | Their day (all must work — not a fragment) |
|---|---|
| **Reporter/Journalist** | assignments & feedback → write in the rich editor (photos, quotes, subheads, fact-boxes, sources, tags, SEO) → submit → revise; can open **Studio** for a promo card |
| **Sub-editor** *(new)* | copy-desk queue → fix headline/style/structure to house style, leave notes → pass up/back |
| **Photographer** *(new)* | upload & own media, set credit/licence/alt, build galleries, attach to stories |
| **Editor** | assignment **desk + editorial calendar** → move through copy-edit → fact-check → legal → ready → **publish/schedule/embargo** → **breaking** → **corrections/retractions** → archive; **run live coverage**; **curate the homepage** |
| **Social / Audience editor** *(new)* | **Studio** graphics + **social/WhatsApp queue** + newsletters + push/breaking alerts + audience analytics |
| **Community Moderator** | comment queue: approve/hide/remove, **ban**, review reports — audit-logged |
| **Ads/Sales Manager** | campaigns + sponsored + **notices/tenders/obituaries** + revenue |
| **Administrator** | **users & roles** (no DB scripts), taxonomy, homepage layout, settings/flags, **audit log**, backups |
| **Reader/Subscriber** | read a **real, richly-laid-out** story; bookmark; **follow sections & topics**; **metered paywall → subscribe (MoMo/Airtel)**; comment; alerts (email/push/WhatsApp) |

A role is **done** when a person in that seat completes their whole job with real content.

---

## 8. Additional capabilities (from how modern newsrooms actually run)

Beyond the brief, a system people call "a system" also needs — sequenced later, but
planned now:

- **Homepage curation tool** — editors arrange the front page (lead, slots, section
  order); the homepage is edited, not just "latest". (Every major paper has this.)
- **Distribution:** breaking **push notifications**, **newsletters** (segments +
  open/click analytics), and **WhatsApp/SMS** distribution (dominant in Rwanda).
- **Real-time analytics** dashboard (Chartbeat-style: who's-reading-now, referrers,
  scroll/completion) — and **view counts that actually increment on read**.
- **Personalisation:** follow sections/topics/authors → a "For you" feed and alerts.
- **Membership & payments:** metered paywall, plans, **gift/【unlocked】 articles**,
  donations, invoices (MoMo/Airtel/card, RwF).
- **AI assist (human-in-loop):** headline/summary/tag suggestions, translation
  (EN⇄RW⇄FR), TTS, comment toxicity pre-screen, alt-text — advisory only (`FR-AI-*`).
- **Search:** OpenSearch (relevance + typo tolerance) replacing the interim Postgres `q`.
- **Multilingual (EN/Kinyarwanda/French):** UI + per-article language variants +
  `hreflang` — a core brand promise (`FR-READ-7`).
- **Syndication/wire:** ingest partner feeds; expose an open API for partners.
- **Trust:** right-of-reply logging, corrections page, fact-check labels, source
  protection (secure tips), **audit log** of privileged actions.

---

## 9. Rebuild order (each shipped **complete**, to §1)

1. **Content model** + rich editor + rich rendering (keystone).
2. **Section & topic taxonomy** (admin-managed) + real seed + section/topic pages.
3. **Media library** (uploads, galleries, credits, variants).
4. **Editor desk** — full workflow, scheduling/embargo, corrections, **homepage curation**.
5. **Live coverage & developing stories** (real-time).
6. **Studio** (flyers/social cards) + **social/WhatsApp queue**.
7. **Reporter / Sub-editor / Photographer** workspaces.
8. **Reader/Subscriber** — metered paywall + subscriptions (MoMo/Airtel) + newsletter + push/WhatsApp.
9. **Moderator** queue; **Ads/Notices**; **Admin** (users/roles/taxonomy/settings/audit); **real analytics**; then AI assist, OpenSearch, i18n, e-paper.

We do **not** start an item until the previous meets §1. `12-Delivery-Plan.md` is the
checkbox tracker, reorganised to mirror these complete workspaces.

---

## 10. Definition of a **complete system**

With **no placeholders**, everyone can say _"this is a system"_:

- A reporter writes a real multi-section, multi-photo story; a sub-editor cleans it;
  an editor schedules and publishes it; it renders as a proper newspaper article, and
  can be **corrected** afterwards with a dated notice readers see.
- An editor runs **live coverage** of an event that readers watch update in real time,
  and **curates the front page**.
- Staff make a branded **flyer/social card in the Studio** and push it out — no
  external software.
- A reader hits the **paywall**, subscribes with **MoMo/Airtel**, reads, follows
  topics, and gets **alerts** (push/WhatsApp/newsletter).
- A moderator keeps comments healthy; an admin runs **users, roles, taxonomy and
  settings** from the dashboard, with a full **audit trail**; analytics reflect **real**
  reading.
- Every screen works on a phone, is accessible, is multilingual-ready, and shows real data.

That is the target. Everything in §9 exists to reach it.

---

*This plan governs execution. When a role's workspace, the content model, the
taxonomy, or a content type changes, update this document and `12-Delivery-Plan.md`
together.*

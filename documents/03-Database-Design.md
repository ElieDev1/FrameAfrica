# Frame Africa — Database Design

**Document:** 03 — Database Design
**Version:** 1.0
**DBMS:** PostgreSQL 15+
**ORM:** Prisma or TypeORM

---

## 1. Design Principles

- **Relational integrity** with foreign keys and constraints; no orphan rows.
- **UUID primary keys** (`uuid_generate_v4()`) for safe distribution and non-guessable IDs.
- **Soft deletes** (`deleted_at`) for content and users; hard delete only on legal erasure.
- **Audit columns** on every table: `created_at`, `updated_at`, plus `created_by` where relevant.
- **Normalized to 3NF**, with **JSONB** used sparingly for flexible metadata (SEO, preferences).
- **Full-text search** offloaded to OpenSearch; PostgreSQL keeps the source of truth.
- **Indexes** on all foreign keys, slugs, statuses, and common filter/sort columns.

## 2. Entity–Relationship Overview

```
                 ┌──────────┐        ┌──────────┐
                 │  role    │◄──────►│   user   │
                 └──────────┘  M:N   └────┬─────┘
                                          │ 1:M (author)
        ┌───────────┐                     ▼
        │ category  │◄───────┐      ┌────────────┐        ┌───────────────┐
        │ (nested)  │  M:1   └──────│  article   │───1:M─►│ article_revision│
        └───────────┘               └────┬───────┘        └───────────────┘
                                    1:M │ │ 1:M
              ┌───────────┐  M:N        │ │        ┌────────────┐
              │   tag     │◄────────────┘ └───────►│ correction │
              └───────────┘                        └────────────┘
                                    1:M │
                                        ▼
                                 ┌────────────┐        ┌───────────┐
                                 │media_asset │        │  comment  │──self ref (replies)
                                 └────────────┘        └─────┬─────┘
                                                             │ M:1
                                                        ┌────▼─────┐
        ┌──────────────┐   ┌──────────────┐             │  user    │
        │ subscription │──►│    user      │◄────────────┘
        └──────────────┘   └──────────────┘
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │ advertiser   │─1:M│  campaign   │─1:M│ advertisement│
        └──────────────┘   └──────────────┘   └──────────────┘
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │ newsletter   │─M:N│ user (subs) │   │ notification │
        └──────────────┘   └──────────────┘   └──────────────┘
        ┌──────────────┐   ┌──────────────┐
        │ notice       │   │ audit_log    │
        │(tender/obit) │   │              │
        └──────────────┘   └──────────────┘
```

## 3. Core Tables (schema)

### 3.1 `user`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | citext UNIQUE | verified via token |
| phone | varchar UNIQUE NULL | for OTP login |
| password_hash | text NULL | Argon2id; null if social-only |
| display_name | varchar | |
| avatar_url | text NULL | |
| status | enum(active, suspended, deleted) | |
| email_verified_at | timestamptz NULL | |
| two_factor_enabled | boolean default false | mandatory for staff |
| two_factor_secret | text NULL | encrypted |
| preferences | jsonb | language, notifications, quiet hours |
| last_login_at | timestamptz NULL | |
| created_at / updated_at / deleted_at | timestamptz | |

### 3.2 `role` and `user_role`
| `role` | Type | |
|---|---|---|
| id | uuid PK | |
| name | enum(reader, journalist, sub_editor, photographer, editor, moderator, ads_manager, admin) | |
| permissions | jsonb | fine-grained permission list |

`user_role` (M:N): `user_id`, `role_id` — a user may hold several roles.

### 3.3 `category`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| parent_id | uuid FK→category NULL | enables unlimited nesting |
| name | varchar | |
| slug | varchar UNIQUE | |
| description | text NULL | |
| sort_order | int | |
| is_active | boolean | |

### 3.4 `article`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | varchar UNIQUE | SEO URL |
| title | varchar | |
| subtitle | varchar NULL | |
| body | text | rich text / structured JSON |
| excerpt | text NULL | |
| author_id | uuid FK→user | |
| category_id | uuid FK→category | |
| featured_image_id | uuid FK→media_asset NULL | |
| status | enum(draft, assigned, in_progress, copy_edit, fact_check, legal, ready, scheduled, embargoed, published, correction_pending, archived, rejected) | |
| language | enum(en, rw, fr, sw) | |
| translation_group_id | uuid NULL | links language variants |
| is_premium | boolean default false | paywall |
| is_breaking | boolean default false | |
| read_time_min | int | computed |
| view_count | bigint default 0 | |
| like_count | int default 0 | |
| share_count | int default 0 | |
| seo | jsonb | seo_title, seo_description, meta_keywords, canonical_url, og fields |
| published_at | timestamptz NULL | |
| scheduled_at | timestamptz NULL | |
| embargo_until | timestamptz NULL | |
| created_at / updated_at / deleted_at | timestamptz | |

**Co-authors:** `article_coauthor(article_id, user_id)` (M:N).
**Tags:** `article_tag(article_id, tag_id)` (M:N); `tag(id, name, slug)`.

### 3.5 `article_revision`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| article_id | uuid FK→article | |
| editor_id | uuid FK→user | who made the change |
| title / body snapshot | text | full snapshot or diff |
| change_note | text NULL | |
| created_at | timestamptz | |

### 3.6 `correction`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| article_id | uuid FK→article | |
| editor_id | uuid FK→user | |
| type | enum(correction, retraction, update) | |
| note | text | shown publicly |
| created_at | timestamptz | public timestamp |

### 3.7 `media_asset`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| type | enum(image, video, audio, pdf, document) | |
| storage_key | text | S3 key |
| url | text | CDN URL |
| variants | jsonb | responsive sizes / HLS renditions |
| credit | varchar NULL | photographer / source |
| license | varchar NULL | rights metadata |
| alt_text | varchar NULL | accessibility |
| uploaded_by | uuid FK→user | |
| created_at | timestamptz | |

### 3.8 `comment`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| article_id | uuid FK→article | |
| user_id | uuid FK→user | |
| parent_id | uuid FK→comment NULL | threaded replies |
| body | text | sanitized |
| status | enum(pending, approved, hidden, removed) | |
| ai_flag | jsonb NULL | spam/abuse scores |
| like_count | int default 0 | |
| created_at / updated_at | timestamptz | |

### 3.9 `subscription`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→user | |
| plan | enum(free, monthly, annual, student) | |
| status | enum(active, past_due, canceled, expired) | |
| provider | enum(momo, airtel, card) | |
| current_period_end | timestamptz | |
| created_at / updated_at | timestamptz | |

`invoice(id, subscription_id, amount_rwf, status, issued_at, pdf_url)`.
`payment(id, subscription_id, provider, provider_ref, amount_rwf, status, created_at)`.

### 3.10 Advertising & Notices
`advertiser(id, name, contact, ...)`
`campaign(id, advertiser_id, name, budget_rwf, start_at, end_at, status)`
`advertisement(id, campaign_id, type, creative_url, target_slot, click_count, impression_count)`
`notice(id, type[tender|obituary|public_notice], title, body, published_at, expires_at, paid)`

### 3.11 Operational
`notification(id, user_id, type, channel, payload jsonb, read_at, created_at)`
`newsletter(id, name, cadence)` · `newsletter_subscription(newsletter_id, user_id, subscribed_at)`
`audit_log(id, actor_id, action, entity_type, entity_id, ip, user_agent, metadata jsonb, created_at)`
`analytics_event(id, session_id, user_id NULL, type, article_id NULL, properties jsonb, created_at)` *(often offloaded to a separate analytics store)*

## 4. Data Dictionary — key enums

| Enum | Values |
|---|---|
| user.status | active, suspended, deleted |
| article.status | draft, assigned, in_progress, copy_edit, fact_check, legal, ready, scheduled, embargoed, published, correction_pending, archived, rejected |
| subscription.plan | free, monthly, annual, student |
| media.type | image, video, audio, pdf, document |
| notice.type | tender, obituary, public_notice |

## 5. Indexing Plan

| Table | Index | Purpose |
|---|---|---|
| article | (slug) UNIQUE | fast URL lookup |
| article | (status, published_at DESC) | homepage/category feeds |
| article | (category_id, published_at DESC) | category pages |
| article | (author_id) | author archive |
| article | (translation_group_id) | language switch |
| comment | (article_id, status, created_at) | comment loading |
| subscription | (user_id, status) | paywall check |
| audit_log | (actor_id, created_at) | investigations |
| media_asset | (uploaded_by) | asset management |

## 6. Integrity & Business Rules

- An article cannot be `published` without at least a title, body, category, and author.
- Deleting a category with children is blocked; reassign or cascade explicitly.
- A `correction` can only attach to a `published` (or later) article.
- Legal erasure anonymizes `user` PII and detaches comments (keeps thread integrity).
- Paywall: `is_premium = true` articles require an `active` subscription unless within the free-meter allowance.

## 7. Backup & Retention

- Automated daily snapshots + WAL archiving for point-in-time recovery.
- Weekly full logical backup stored in redundant, encrypted object storage.
- Analytics events retained 24 months; audit logs retained per legal requirement.
- Backups are **encrypted at rest** and restore-tested on a schedule (see `08`).

---

*Access control over this data is defined in `05-Security-Design.md`; the API that exposes it in `04-API-Design.md`.*

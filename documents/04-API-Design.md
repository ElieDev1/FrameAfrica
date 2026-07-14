# Frame Africa — API Design

**Document:** 04 — API Design
**Version:** 1.0
**Style:** RESTful JSON over HTTPS · versioned · JWT-secured

---

## 1. Conventions

- **Base URL:** `https://api.frameafrica.rw/v1`
- **Format:** JSON request/response; UTF-8; `Content-Type: application/json`.
- **Versioning:** URL-prefixed (`/v1`). Breaking changes → `/v2`.
- **Auth:** `Authorization: Bearer <access_token>` (JWT). Public read endpoints allow anonymous access.
- **IDs:** UUIDs.
- **Timestamps:** ISO-8601 UTC.
- **Naming:** plural nouns, kebab-case paths, camelCase JSON fields.
- **Pagination:** cursor-based — `?limit=20&cursor=<opaque>`.
- **Filtering/sorting:** `?category=politics&sort=-publishedAt`.
- **Idempotency:** mutating POSTs that must not double-run accept an `Idempotency-Key` header (payments, publishing).

## 2. Standard Response Envelopes

**Success**
```json
{
  "data": { },
  "meta": { "requestId": "…", "pagination": { "nextCursor": "…", "hasMore": true } }
}
```

**Error** (consistent shape for every failure)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required.",
    "details": [{ "field": "title", "issue": "required" }],
    "requestId": "req_01H…"
  }
}
```

**Error codes:** `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `PAYMENT_REQUIRED`, `INTERNAL_ERROR`.

## 3. HTTP Status Usage

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Validation error |
| 401 | Missing/invalid auth |
| 403 | Authenticated but not allowed |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate slug) |
| 422 | Semantically invalid |
| 429 | Rate limited |
| 5xx | Server error |

## 4. Authentication Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Create account, send verification | Public |
| POST | `/auth/verify-email` | Confirm email token | Public |
| POST | `/auth/login` | Email+password → tokens | Public |
| POST | `/auth/oauth/google` | Google sign-in | Public |
| POST | `/auth/oauth/apple` | Apple sign-in | Public |
| POST | `/auth/otp/request` | Send phone OTP | Public |
| POST | `/auth/otp/verify` | Verify OTP → tokens | Public |
| POST | `/auth/2fa/enable` | Begin TOTP enrollment | User |
| POST | `/auth/2fa/verify` | Confirm 2FA code | User |
| POST | `/auth/refresh` | Rotate refresh → new access | Refresh cookie |
| POST | `/auth/logout` | Revoke session | User |
| POST | `/auth/password/forgot` | Send reset link | Public |
| POST | `/auth/password/reset` | Set new password | Public (token) |

**Token model:** short-lived **access JWT** (~15 min) + long-lived **refresh token** stored in an HTTP-only, Secure, SameSite=Strict cookie; refresh rotation with reuse detection. (Full rules in `05`.)

## 5. Content Endpoints

### Public (read)
| Method | Path | Description |
|---|---|---|
| GET | `/articles` | List published articles (filters: category, tag, author, language, q) |
| GET | `/articles/{slug}` | Get one published article (respects paywall) |
| GET | `/articles/{slug}/related` | Related articles |
| GET | `/categories` | Category tree |
| GET | `/categories/{slug}/articles` | Articles in category |
| GET | `/search?q=` | Search articles (relevance-ranked, paginated) |
| GET | `/search/media?q=` | Search multimedia (galleries, episodes, videos, interactives) |
| GET | `/live/{id}` | Live blog stream (SSE/WebSocket upgrade) |
| GET | `/notices` | Public notices / tenders / obituaries |
| GET | `/videos` · `/galleries` · `/podcasts` · `/interactives` | Multimedia hubs — accept `?limit=&page=`, answer `meta.pagination.hasMore` |
| GET | `/videos/{id}` · `/galleries/{slug}` · `/podcasts/{slug}` · `/interactives/{slug}` | One item, for its own page |
| GET | `/authors` | Everyone who has published (name, job title, bio, story count) |
| GET | `/authors/{slug}` | One author's public page |

**Author pages.** Every user carries an `author_slug`, but only a *published* writer is
reachable: `/authors/{slug}` for a slug that has never published is a **404**, not an empty
profile — a reader's account has a slug too, and asking must not confirm that it exists.
The slug is assigned once and does not follow a later rename, so a URL that has been shared
or indexed keeps working. An author's stories are not duplicated in the profile response;
they come from `GET /articles?author={slug}`, which already paginates.

### CMS (journalist / editor) — role-gated
| Method | Path | Description | Role |
|---|---|---|---|
| POST | `/cms/articles` | Create draft | journalist+ |
| GET | `/cms/articles` | List my/all drafts (scope by role) | journalist+ |
| PATCH | `/cms/articles/{id}` | Update draft (creates revision) | author/editor |
| POST | `/cms/articles/{id}/submit` | Submit for review | journalist |
| POST | `/cms/articles/{id}/transition` | Move workflow state | editor |
| POST | `/cms/articles/{id}/publish` | Publish / schedule | editor |
| POST | `/cms/articles/{id}/corrections` | Add correction/retraction | editor |
| GET | `/cms/articles/{id}/revisions` | Revision history | editor |
| POST | `/cms/media/sign` | Get signed upload URL | journalist+ |

**Workflow transition** request:
```json
POST /cms/articles/{id}/transition
{ "to": "fact_check", "note": "Awaiting source confirmation" }
```
Rejected if the transition is not allowed for the caller's role or current state.

## 6. Engagement Endpoints

Engagement is **polymorphic**: `{type}` is one of `article | gallery | episode | interactive | video`,
and `{id}` is that item's UUID. One comment table, one like table and one moderation
queue serve every content type.

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/engagement/{type}/{id}` | Like / share / comment counts (+ `liked` when signed in) | Public |
| POST | `/engagement/{type}/{id}/like` | Like / unlike | User |
| POST | `/engagement/{type}/{id}/share` | Record a share (rate-limited) | Public |
| GET | `/comments/{type}/{id}` | List visible comments (threaded) | Public |
| POST | `/comments/{type}/{id}` | Add comment (AI-screened) | User |
| GET | `/articles/{id}/comments` | List approved comments (article alias) | Public |
| POST | `/articles/{id}/comments` | Add comment (article alias) | User |
| POST | `/comments/{id}/like` | Like a comment | User |
| POST | `/comments/{id}/report` | Report abuse | User |
| POST | `/cms/comments/{id}/moderate` | Approve/hide/remove (any type) | moderator |
| POST | `/me/bookmarks/{articleId}` | Bookmark | User |
| GET | `/me/bookmarks` | List bookmarks | User |
| POST | `/me/follows/{categoryId}` | Follow category | User |
| GET | `/me/notifications` | Notification inbox | User |
| PATCH | `/me/preferences` | Update prefs / quiet hours | User |

## 7. Monetization Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/billing/plans` | List subscription plans | Public |
| GET | `/billing/me/subscription` | Current subscription (plan, status, period end) | User |
| GET | `/billing/me/payments` | Payment history | User |
| POST | `/billing/me/checkout` | Start a subscription — a Stripe checkout URL, or a mobile-money prompt on the reader's handset | User |
| POST | `/billing/me/cancel` | Cancel at period end (paid days are not taken back) | User |
| POST | `/billing/webhooks/stripe` | Stripe callback (HMAC-verified) | Provider (signed) |
| POST | `/billing/webhooks/{momo\|airtel}` | Mobile-money callback | Provider |
| POST | `/admin/billing/grant` | Comped / corporate / cash subscription | admin |
| POST | `/admin/billing/expire-lapsed` | Sweep subscriptions past their period end | admin |
| GET | `/ads/serve?slot=` | Get ad for placement | Public |
| POST | `/ads/{id}/click` | Track click | Public |

**Settlement is the only path that grants access**, and it is idempotent: a UNIQUE index on
`payment.provider_ref` is the database-level replay guard, so a webhook delivered twice cannot
buy a second period. A renewal extends from the current period end rather than from "now", so a
reader who pays early never loses days they have already bought. Entitlement lives in one field —
`user.subscribed_until` — which is the field the paywall already reads.

Paywall check happens server-side on `/articles/{slug}`: premium content returns `402 PAYMENT_REQUIRED` with a preview payload when the reader is over the free meter and unsubscribed. The reader is then offered `/pricing` — a wall with no door is just a broken page.

## 8. Admin Endpoints

| Method | Path | Description | Role |
|---|---|---|---|
| GET | `/admin/users` | List/search users | admin |
| PATCH | `/admin/users/{id}/roles` | Assign roles | admin |
| GET | `/admin/analytics/overview` | Dashboard metrics | admin/editor |
| GET | `/admin/audit-logs` | Query audit trail | admin |
| GET | `/admin/settings/integrations` | List every integration key, grouped, with its set-state | admin |
| PUT | `/admin/settings/integrations/{key}` | Set an integration value | admin |
| DELETE | `/admin/settings/integrations/{key}` | Clear a stored value (falls back to env) | admin |
| POST | `/admin/backups` | Trigger backup | admin |

### 8.1 Integration settings

Every key in the catalogue maps 1:1 to an env var; a value stored in the DB **overrides** `process.env`. Keys are grouped (`social`, `site`, `email`, `storage`, `search`, `payments`, `ai`, `analytics`, `media`) and each is flagged `secret`:

- **`secret: true`** (API keys, passwords) — **write-only**. The list endpoint returns `maskedValue` (`••••1234`) and `value: null`. The raw value is only ever resolved server-side by the service that consumes it.
- **`secret: false`** (social URLs, hostnames, contact details) — returned in the clear so the dashboard can pre-fill the field for editing.

**Public read.** The footer needs the social links, which are public by definition:

| Method | Path | Description | Role |
|---|---|---|---|
| GET | `/site/settings` | Configured social profiles + contact details | Public |

This route reads a **fixed allow-list** of non-secret keys (`SOCIAL_*`, `CONTACT_EMAIL`, `CONTACT_PHONE`) — it cannot return anything else, whatever is stored. Unset keys are omitted (the footer then hides that icon), and a social value is rejected on write and dropped on read unless it is a plain `http(s)` URL, so no `javascript:`/`data:` URI can reach an `href`.

## 9. AI Endpoints (advisory)

| Method | Path | Description | Status |
|---|---|---|---|
| GET | `/ai/status` | Is a key configured? (the editor hides its buttons when not) | ✅ |
| POST | `/ai/summarize` | Standfirst + key points, in the article's own language | ✅ |
| POST | `/ai/headlines` | Five ranked headline options + a standfirst | ✅ |
| POST | `/ai/tags` | Section + topic tags, drawn from the taxonomy that exists | ✅ |
| POST | `/ai/translate` | Translate a draft (en / rw / fr / sw) | ✅ |
| POST | `/ai/moderate` | Score a comment for spam/abuse | planned |

All AI endpoints are **staff-only**, rate-limited (20/min — each call costs money at the provider), and return suggestions the human may accept or reject; **nothing auto-publishes**.

The provider key (`ANTHROPIC_API_KEY`, optionally `ANTHROPIC_MODEL`) is resolved **per call from Settings**, so an admin can add, rotate, or pull it from the dashboard without a redeploy. With no key configured the endpoints answer `503` with a message saying where to fix it, rather than half-working.

`/ai/tags` is grounded in reality: the model is given the site's real section and topic names, and a section it invents is **dropped** rather than guessed at — a suggestion the newsroom cannot file under is worse than no suggestion.

## 9a. Push Endpoints (breaking-news alerts)

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/push/key` | The VAPID public key a browser needs to subscribe (`null` = not set up) | Public |
| GET | `/push/status?endpoint=` | Is this browser already subscribed? | Public |
| POST | `/push/subscribe` | Remember this browser | Public (tied to the account when a token is present) |
| POST | `/push/unsubscribe` | Forget this browser | Public |
| GET | `/admin/push` | Configured? How many browsers can we reach? | admin |
| POST | `/admin/push/keys?force=` | Generate the VAPID pair (`force` rotates — see below) | admin |

A subscription belongs to a **browser**, not an account: no sign-in is required (`user_id` is
nullable), and the push service's `endpoint` is the identity — so re-subscribing the same browser
updates its row instead of fanning out duplicate alerts. Unsubscribing always works, even if push
has since been switched off.

Publishing an article with `is_breaking` broadcasts its headline to every subscription. A browser
that answers `404`/`410` has revoked permission or cleared its data and is **pruned**; a transient
failure is left alone and retried on the next alert. **The alert never blocks the publish** — if the
push service is down, the story is still out and the failure is logged. Rotating the VAPID pair
changes the identity we push under and orphans every existing subscription, so it takes an explicit
`force=true` and drops the stale rows rather than failing on every send.

## 10. Rate Limiting

| Scope | Limit (example) |
|---|---|
| Anonymous read | 120 req/min/IP |
| Auth attempts | 5 fails → temp lockout + backoff |
| Comment post | 5/min/user |
| AI endpoints | tuned per plan/cost |
| Payment webhooks | signature-verified, idempotent |

`429` responses include `Retry-After`.

## 11. Real-time

- **Live blogs / tickers:** Server-Sent Events (SSE) or WebSocket channel per live event; falls back to polling on constrained networks.
- **Notifications:** push via Firebase Cloud Messaging; in-app inbox via REST.

## 12. API Documentation & Contract

- **OpenAPI 3.1** spec generated from NestJS decorators; served at `/v1/docs` (protected in non-prod).
- Contract tests verify the spec matches implementation (see `08`).
- SDK/types shared with the Next.js frontend via generated TypeScript clients.

---

*Security of these endpoints (validation, authZ, headers, CORS) is specified in `05-Security-Design.md`.*

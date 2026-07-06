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
| GET | `/search?q=` | Search (proxy to OpenSearch) |
| GET | `/live/{id}` | Live blog stream (SSE/WebSocket upgrade) |
| GET | `/notices` | Public notices / tenders / obituaries |

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

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/articles/{id}/comments` | List approved comments | Public |
| POST | `/articles/{id}/comments` | Add comment (AI-screened) | User |
| POST | `/comments/{id}/like` | Like a comment | User |
| POST | `/comments/{id}/report` | Report abuse | User |
| POST | `/cms/comments/{id}/moderate` | Approve/hide/remove | moderator |
| POST | `/me/bookmarks/{articleId}` | Bookmark | User |
| GET | `/me/bookmarks` | List bookmarks | User |
| POST | `/me/follows/{categoryId}` | Follow category | User |
| GET | `/me/notifications` | Notification inbox | User |
| PATCH | `/me/preferences` | Update prefs / quiet hours | User |

## 7. Monetization Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/plans` | List subscription plans | Public |
| POST | `/subscriptions` | Start subscription (returns payment intent) | User |
| POST | `/payments/webhook/momo` | MTN MoMo callback | Provider (signed) |
| POST | `/payments/webhook/airtel` | Airtel callback | Provider (signed) |
| POST | `/payments/webhook/card` | Card gateway callback | Provider (signed) |
| GET | `/me/subscription` | Current subscription status | User |
| GET | `/me/invoices` | Invoice history | User |
| GET | `/ads/serve?slot=` | Get ad for placement | Public |
| POST | `/ads/{id}/click` | Track click | Public |

Paywall check happens server-side on `/articles/{slug}`: premium content returns `402 PAYMENT_REQUIRED` with a preview payload when the reader is over the free meter and unsubscribed.

## 8. Admin Endpoints

| Method | Path | Description | Role |
|---|---|---|---|
| GET | `/admin/users` | List/search users | admin |
| PATCH | `/admin/users/{id}/roles` | Assign roles | admin |
| GET | `/admin/analytics/overview` | Dashboard metrics | admin/editor |
| GET | `/admin/audit-logs` | Query audit trail | admin |
| PATCH | `/admin/settings` | System settings / feature flags | admin |
| POST | `/admin/backups` | Trigger backup | admin |

## 9. AI Endpoints (advisory)

| Method | Path | Description |
|---|---|---|
| POST | `/ai/summarize` | Draft summary for an article |
| POST | `/ai/headlines` | Suggest headlines |
| POST | `/ai/tags` | Suggest tags/category |
| POST | `/ai/translate` | Translate draft |
| POST | `/ai/moderate` | Score comment for spam/abuse |

All AI endpoints are **staff-only**, rate-limited, and return suggestions the human may accept or reject; nothing auto-publishes.

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

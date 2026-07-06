# Frame Africa — Use Cases, User Stories & Data Flows

**Document:** 07 — Use Cases
**Version:** 1.0

---

## 1. Actors

| Actor | Description |
|---|---|
| Visitor | Unauthenticated reader |
| Reader | Registered/logged-in reader |
| Subscriber | Reader with an active paid plan |
| Journalist | Creates content |
| Sub-editor | Copy-edits content |
| Editor | Approves, publishes, corrects |
| Moderator | Moderates comments |
| Ads Manager | Manages ads & notices |
| Admin | System administration |
| System | Automated jobs (scheduler, notifications, AI, payments) |

## 2. Use-Case Diagram (textual)

```
Visitor      → Browse news · Search · Read · Share · Subscribe to newsletter
Reader       → (Visitor) + Register/Login · Comment · Bookmark · Follow · Get alerts
Subscriber   → (Reader) + Read premium · Manage subscription · Download invoice
Journalist   → Create draft · Upload media · Submit for review · Edit own article
Sub-editor   → Copy-edit · Return to journalist
Editor       → Review · Approve/Reject · Publish/Schedule · Feature breaking · Correct · Archive
Moderator    → Approve/Hide/Remove comments · Ban users
Ads Manager  → Create campaigns · Manage notices · View revenue
Admin        → Manage users/roles · Configure system · View analytics · Backup
System       → Publish scheduled · Send notifications · Screen comments · Process payments · Index search
```

## 3. Detailed Use Cases

### UC-01 — Read an article (with paywall)
- **Actor:** Visitor / Reader / Subscriber
- **Precondition:** Article is published.
- **Main flow:**
  1. Actor opens an article URL.
  2. System serves the article (edge-cached if anonymous).
  3. If article is premium and actor is over the free meter and not subscribed → system shows a preview + paywall prompt.
  4. Actor reads (or subscribes, then reads).
- **Alternate:** Article corrected → correction notice shown inline.
- **Postcondition:** View counted; reading history updated (if logged in).

### UC-02 — Register & verify account
- **Actor:** Visitor
- **Flow:** Submit email/password → system creates account (status: unverified) → sends verification email → actor clicks link → account active.
- **Exceptions:** Email in use → 409; weak password → 400.

### UC-03 — Write and submit an article
- **Actor:** Journalist
- **Precondition:** Logged in with journalist role.
- **Flow:**
  1. Create draft; enter title, body, category, tags, SEO.
  2. Upload media via signed URL; add credits/alt text.
  3. Save (each save creates a revision).
  4. Log right-of-reply if applicable.
  5. Submit for review → status = Review.
- **Postcondition:** Editors notified; article awaits approval.

### UC-04 — Review and publish
- **Actor:** Editor
- **Flow:**
  1. Open submitted article; read + edit.
  2. Move through copy-edit / fact-check / legal as needed.
  3. Approve → Publish now or Schedule / set embargo.
  4. Optionally flag as Breaking.
- **On publish, System:** indexes for search, revalidates the page (ISR), warms CDN, queues notifications to followers/breaking subscribers.
- **Alternate:** Reject with note → back to journalist.

### UC-05 — Publish a correction
- **Actor:** Editor
- **Precondition:** Article already published.
- **Flow:** Add correction/retraction/update note → system appends a dated public notice, records a revision, and updates the corrections page.
- **Postcondition:** Transparency preserved; readers see what changed.

### UC-06 — Comment and moderation
- **Actor:** Reader → Moderator
- **Flow:**
  1. Reader posts a comment.
  2. System AI-screens for spam/abuse; borderline → queued as pending.
  3. Moderator approves/hides/removes; repeat offenders banned (logged).
- **Postcondition:** Healthy discussion; audit trail kept.

### UC-07 — Subscribe (MoMo/Airtel/card)
- **Actor:** Reader
- **Flow:**
  1. Choose plan → system creates subscription (pending) + payment intent.
  2. Actor pays via MoMo/Airtel/card.
  3. Provider calls webhook → system verifies signature → activates subscription → issues invoice.
  4. Actor gains premium access.
- **Exceptions:** Payment fails → subscription stays pending; actor retried/notified.

### UC-08 — Receive breaking-news alert
- **Actor:** System → Reader
- **Flow:** Editor flags breaking → system fan-outs push/email/SMS per user preferences and quiet hours → reader taps → opens live/article.

### UC-09 — Search
- **Actor:** Any
- **Flow:** Enter query → system queries OpenSearch with typo tolerance + filters → ranked results with highlights; empty → suggestions/trending.

### UC-10 — Submit a secure tip
- **Actor:** Visitor
- **Flow:** Open tips page (no trackers) → submit anonymously → stored encrypted, restricted access → newsroom follows up per procedure.

### UC-11 — Manage users & roles
- **Actor:** Admin
- **Flow:** Search user → assign/revoke roles → change applies immediately (session/authZ refreshed) → action audit-logged.

### UC-12 — Erase my data
- **Actor:** Reader
- **Flow:** Request deletion → system confirms → anonymizes PII, detaches comments, cancels subscription → confirmation sent. (Rwanda Law N° 058/2021.)

## 4. Representative User Stories

- *As a reader*, I want to switch to Kinyarwanda so I can read in my language.
- *As a commuter on slow data*, I want a data-saver mode so pages load fast.
- *As a journalist*, I want draft autosave and revisions so I never lose work.
- *As an editor*, I want an approval workflow so nothing publishes unreviewed.
- *As an editor*, I want to post corrections so our journalism stays trustworthy.
- *As a subscriber*, I want to pay with MoMo so I don't need a card.
- *As a moderator*, I want AI to pre-filter spam so I focus on real issues.
- *As an admin*, I want an audit log so I can see who changed what.

## 5. Key Data Flow — Scheduled Publishing

```
Editor sets scheduled_at → status = Scheduled (stored)
        │
System scheduler (cron/queue) checks due articles every minute
        │ when now ≥ scheduled_at
        ▼
Set status = Published → index search → ISR revalidate → CDN warm
        → queue notifications → done (audit-logged)
```

## 6. Key Data Flow — Payment Webhook (secure)

```
Reader pays at provider (MoMo/Airtel/card)
        │
Provider → POST /payments/webhook/{provider}  (signed)
        │
API verifies signature + idempotency key
        ├─ invalid → 400, alert
        └─ valid → mark payment succeeded
                 → activate subscription
                 → generate invoice (PDF)
                 → notify reader
                 → audit-log
```

## 7. Abuse / Negative Cases (security-relevant)

| Case | System response |
|---|---|
| Repeated failed logins | Backoff + lockout + alert (§05) |
| XSS payload in comment | Sanitized/stripped; stored safely |
| Direct access to others' draft (IDOR) | 403 via object-level authZ |
| Replayed payment webhook | Idempotency prevents double-grant |
| Scraper hammering API | Rate limit → 429 + edge bot rules |
| Unverified email posting | Blocked until verification |

---

*Each use case traces to requirements in `01-SRS.md`, endpoints in `04-API-Design.md`, and tests in `08-Test-Deployment.md`.*

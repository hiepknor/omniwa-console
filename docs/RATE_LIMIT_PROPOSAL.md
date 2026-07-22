# Proposal — server-side WhatsApp rate-limit safety for OmniWA GO

**Audience:** the omniwa-go backend team.
**Status:** proposal. The console has shipped its client-side mitigation
(“Tier 1”, see §7); this document proposes the **server-side** work needed to
*guarantee* WhatsApp is never rate-limited, regardless of how many clients call
the API — and to unlock the console panels that are currently stubbed.

---

## 1. Problem

Several read endpoints resolve by issuing a **live WhatsApp query** (whatsmeow
“info query”): `GET /group/list`, `POST /group/info`, `POST /group/invitelink`,
the `/user/*` lookups, and anything that reads live account/chat state. WhatsApp
rate-limits these per account.

Observed failure mode (reproduced):

1. Multiple callers (console tabs, other integrations) hit `/group/list` /
   `/group/info` concurrently and/or on a poll. Each is a separate WhatsApp
   info query.
2. WhatsApp returns `429`. omniwa-go surfaces this as **`HTTP 500`** with body
   `{"error":"info query returned status 429: rate-overlimit"}`.
3. Because it looks like a generic 500, naive clients **retry**, deepening the
   throttle; the cooldown then lasts many minutes.
4. In the worst case the account’s socket is dropped and the device is
   **logged out** (must re-pair via QR).

Root issue: **expensive, rate-limited WhatsApp queries are exposed as if they
were cheap reads**. Every read hits WhatsApp live. No client can see another
client’s load, so no client-side fix can *guarantee* the cap — only the server
can, because it is the single choke point in front of WhatsApp.

## 2. Goals

- **G1** — Never exceed WhatsApp’s info-query rate for an account, across all
  callers, even under bursts.
- **G2** — Never spiral: a WhatsApp 429 must trigger back-off, not more queries.
- **G3** — Keep reads fast and cheap for callers (never a live query on the read
  path).
- **G4** — Make throttling machine-readable so clients back off precisely.
- **G5** — Protect the session: rate-limit handling must not cause logouts.
- **G6** — Unlock read surfaces the API cannot currently serve at all (chat
  list/history, contacts, events) by making them queryable.

## 3. Recommended architecture — DB/cache-first (event-sourced projection)

**Reads should never hit WhatsApp.** omniwa-go should be the local **source of
truth**: maintain its own datastore of account state (it already runs Postgres
for instances) and serve every read from it. WhatsApp is touched only to
**receive events**, to **perform actions**, and for a rare, controlled
**cold-start sync**.

### 3.1 Persist account state
Extend the datastore beyond instances to cover **groups, participants, contacts,
chats, messages, labels** — the resources clients read.

### 3.2 Ingest the event stream into the DB
Consume the whatsmeow event stream (the same source that powers `/ws`:
`message`, `send_message`, `group`, `participant`, `contact`, `newsletter`,
`connection`, …) and **write those events into the datastore**. This is the core
work — turning the ephemeral stream into persisted, queryable state. Group
renames, membership changes, new messages, etc. land in the DB within seconds.

### 3.3 Write-through on mutations
When a mutation succeeds (`/group/name·description·participant·settings`, sends,
…), update the local record immediately rather than waiting for the echo event,
so the caller’s next read is consistent.

### 3.4 Reads become DB queries
`/group/list`, `/group/info`, contacts, chats, and message history read from the
datastore — with server-side **pagination, filtering, and search** (which
clients want anyway). No token budget is spent; no WhatsApp query is issued.

### 3.5 Cold-start & reconciliation sync
When an instance first connects (or after downtime that dropped events), run a
**bounded, rate-limited** full sync **once** to populate the DB (list groups,
contacts), then rely on events. A low-rate periodic reconciliation closes gaps
from missed events. **This is the only remaining live-query path** — and it is
rare and controlled, so the limiter (§4) fully contains it.

**Payoff:** reads become rate-limit-proof (G1, G3), and the resources that have
**no live query today** (chat list/history, contacts, durable events) become
serveable from the DB (G6) — which lets the console un-stub those panels.

## 4. Protecting the residual live paths

A few things are inherently live and cannot be served from the DB:

- **Cold-start / reconciliation sync** (§3.5),
- **QR generation** (`/instance/qr`) — rotates, one-time; never cacheable,
- **Actions** (send, connect, mutations).

Guard the *query* parts of these with a small safety layer so even the sync path
and any residual live read can never exceed the cap:

- **4.1 Per-instance token-bucket limiter** in front of every outbound WhatsApp
  info query (size below WhatsApp’s cap, e.g. `WA_INFO_RATE = 5/min`,
  `burst = 3`). When empty: serve the DB value if present, else queue up to
  `WA_INFO_MAX_WAIT`, else return `429` (§4.3). This is the hard guarantee for G1.
- **4.2 Single-flight coalescing** — concurrent identical live queries collapse
  into one.
- **4.3 Proper throttling responses** — respond `HTTP 429` (not 500) with a
  `Retry-After` header and body `{"error":"rate_limited","retryAfter":<s>}` so
  clients back off precisely (G4).
- **4.4 Per-instance circuit breaker (G2, G5)** — when WhatsApp returns 429, open
  a breaker for `WA_INFO_COOLDOWN` (honoring any upstream `Retry-After`): serve
  cache/DB, reject new live queries with `429 + Retry-After`, and **stop probing
  WhatsApp** (probing is what extends the ban and drops the socket). Half-open
  with a single trial query after the cooldown.

## 5. Suggested config knobs

| Key | Meaning | Example |
| --- | --- | --- |
| `WA_INFO_RATE` | Live info queries/min per instance (below WhatsApp’s cap) | `5/min` |
| `WA_INFO_BURST` | Token-bucket burst | `3` |
| `WA_SYNC_INTERVAL` | Background reconciliation cadence | `30m` |
| `WA_INFO_MAX_WAIT` | Max queue wait before 429 | `5s` |
| `WA_INFO_COOLDOWN` | Circuit-breaker open duration | `90s` |
| `WA_MSG_RETENTION` | Message-history retention | `30d` |

## 6. Priority / phasing

The projection is the target, built **incrementally by resource** — each one
turns a live-query read into a DB read and unlocks the matching console panel:

1. **§4.3 proper `429` + `Retry-After`** and **§4.4 circuit breaker** — smallest
   change, biggest safety win (stops the spiral and the logouts). Do first.
2. **Groups projection** (§3.2–3.4 for groups + §3.5 sync + §4 limiter) — removes
   the observed failure; console groups can poll freely again.
3. **Contacts projection** — unlocks contact lookup/search in the console.
4. **Chats + messages projection** — the big one; unlocks the **Chats** panel
   (list + history), which is stubbed today purely for lack of a read source.
5. **Events/audit** — persist the event stream durably; unlocks the **Events**
   panel.

## 7. What the console already does (Tier-1 client contract)

Client-side “Tier 1” (shipped) removes the console as a *cause* but cannot
guarantee the cap:

- WhatsApp-live reads (`/group/list·info·invitelink`) **do not poll** —
  `staleTime` 5m, refetch only on explicit Refresh or after a mutation; cheap DB
  reads (`/instance/all·info·status`) still poll.
- Errors whose body contains `rate-overlimit`/`429`/`too many` are classified
  `rate_limited` and are **never auto-retried**.
- `refetchOnWindowFocus` is off; the Refresh control is disabled while a fetch is
  in flight.

The console adopts the server behavior above immediately: it already honors
`rate_limited`; it would use a real `429` + `Retry-After` to show a precise
back-off; and **once a resource is DB-backed (§3), the console re-enables safe
polling for it and un-stubs the corresponding panel** (chats, contacts, events).
Each backend projection therefore pays off directly as new console capability.

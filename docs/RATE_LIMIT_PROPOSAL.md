# Proposal — server-side WhatsApp rate-limit safety for OmniWA GO

**Audience:** the omniwa-go backend team.
**Status:** proposal. The console has shipped its client-side mitigation
(“Tier 1”, see below); this document proposes the **server-side** work needed to
*guarantee* WhatsApp is never rate-limited, regardless of how many clients call
the API.

---

## 1. Problem

Several read endpoints resolve by issuing a **live WhatsApp query** (whatsmeow
“info query”): `GET /group/list`, `POST /group/info`, `POST /group/invitelink`,
`GET /instance/qr`, and the `/user/*` lookups. WhatsApp rate-limits these per
account.

Observed failure mode (reproduced):

1. Multiple callers (console tabs, other integrations) hit `/group/list` /
   `/group/info` concurrently and/or on a poll. Each is a separate WhatsApp
   info query.
2. WhatsApp returns `429`. omniwa-go surfaces this as **`HTTP 500`** with body
   `{"error":"info query returned status 429: rate-overlimit"}`.
3. Because it looks like a generic 500, naive clients **retry**, which deepens
   the throttle. The cooldown then lasts many minutes.
4. In the worst case the account’s socket is dropped and the device is
   **logged out** (must re-pair via QR).

Root issue: **expensive, rate-limited WhatsApp queries are exposed as if they
were cheap reads**, with no server-side budgeting, caching, coalescing, or
back-pressure. One client cannot see another client’s load, so no client-side
fix can *guarantee* the cap is respected — only the server can, because it is
the single choke point in front of WhatsApp.

## 2. Goals

- **G1 — Never exceed WhatsApp’s info-query rate** for an account, across all
  callers, even under bursts.
- **G2 — Never spiral**: a WhatsApp 429 must trigger back-off, not more queries.
- **G3 — Keep reads fast and cheap** for callers (serve cache, not a live query,
  whenever possible).
- **G4 — Make throttling machine-readable** so clients can back off precisely.
- **G5 — Protect the session**: rate-limit handling must not cause logouts.

## 3. Proposed design (layered)

### 3.1 Per-instance token-bucket limiter (G1)
Put a **token-bucket** in front of every outbound WhatsApp info query, **keyed
by instance**. Size it *below* WhatsApp’s real limit, with margin (configurable,
e.g. `WA_INFO_RATE = 5/min`, `burst = 3`). When empty:

- prefer to **serve cache** (§3.2) if a value exists;
- else **queue** the request up to `WA_INFO_MAX_WAIT` (e.g. 5s) then fail;
- if it can’t be served in time, return **`429` + `Retry-After`** (§3.4).

This is the component that makes G1 a guarantee: the bucket is the only path to
WhatsApp, so the aggregate rate is bounded no matter how many callers there are.

### 3.2 Read-through cache for info queries (G3)
Cache the result of each WhatsApp-live read, keyed by `(instanceId, kind, arg)`
(e.g. `(inst, group_info, groupJid)`), with a short TTL
(`WA_INFO_CACHE_TTL`, e.g. 30–60s). Reads are served from cache within the TTL
and only spend a bucket token on a miss. Invalidate a group’s cache entry when:

- a mutation for it succeeds (`/group/name·description·participant·settings`),
- a relevant `/ws` group event arrives (see §3.6),
- or the TTL expires.

With a 30–60s TTL, a console polling every 15s costs **one** WhatsApp query per
TTL instead of one per poll.

### 3.3 Single-flight / request coalescing (G1, G3)
If several callers ask for the *same* uncached key at once, issue **one**
WhatsApp query and fan the result out to all waiters. Prevents a thundering herd
from spending N tokens for one logical read.

### 3.4 Proper throttling responses (G4)
When a request can’t be served without exceeding the budget, or when WhatsApp
itself returns 429, respond with:

- **HTTP `429 Too Many Requests`** (not 500), and
- a **`Retry-After`** header (seconds), and
- body `{"error":"rate_limited","retryAfter":<seconds>}`.

This lets clients back off exactly. (The console already treats a body
containing `rate-overlimit`/`429` as `rate_limited` and stops retrying; a real
`429` + `Retry-After` makes that precise and lets it show a countdown.)

### 3.5 Per-instance circuit breaker on WhatsApp 429 (G2, G5)
When WhatsApp returns a 429 for an instance, **open a breaker** for a cooldown
(`WA_INFO_COOLDOWN`, e.g. 60–120s, ideally honoring any upstream `Retry-After`).
While open:

- serve cache for reads; reject new live queries with `429` + `Retry-After`;
- **do not** keep probing WhatsApp (that is what extends the ban and can drop
  the socket). Half-open with a single trial query after the cooldown.

### 3.6 (Deepest) event-sourced projection (G1, G3)
The strongest fix: maintain group/contact state as a **local projection** kept
current from the `/ws` event stream (`group`, `participant`, `newsletter`,
`contact` events) plus a low-rate background reconciliation. Then `/group/list`
and `/group/info` become **cache reads of a maintained projection** — cheap and
never rate-limited — exactly like the omniwa Platform’s projection model. Live
WhatsApp queries are reserved for cold-start / explicit resync only. This lets
clients poll freely and removes the class of problem, not just its symptoms.

## 4. Suggested config knobs

| Key | Meaning | Example |
| --- | --- | --- |
| `WA_INFO_RATE` | Info queries/min per instance (below WhatsApp’s cap) | `5/min` |
| `WA_INFO_BURST` | Token-bucket burst | `3` |
| `WA_INFO_CACHE_TTL` | Read-through cache TTL | `45s` |
| `WA_INFO_MAX_WAIT` | Max queue wait before 429 | `5s` |
| `WA_INFO_COOLDOWN` | Circuit-breaker open duration | `90s` |

## 5. Priority / phasing

1. **§3.4 proper `429` + `Retry-After`** and **§3.5 circuit breaker** — smallest
   change, biggest safety win (stops the spiral and the logouts). Do first.
2. **§3.2 cache + §3.3 single-flight + §3.1 limiter** — makes normal usage
   essentially never hit the cap.
3. **§3.6 event-sourced projection** — the durable end state; larger effort.

## 6. What the console already does (the contract to design against)

Client-side “Tier 1” (shipped) removes the console as a *cause* but cannot
guarantee the cap:

- WhatsApp-live reads (`/group/list·info·invitelink`) **do not poll** —
  `staleTime` 5m, refetch only on explicit Refresh or after a mutation; cheap
  DB reads (`/instance/all·info·status`) still poll.
- Errors whose body contains `rate-overlimit`/`429`/`too many` are classified
  `rate_limited` and are **never auto-retried**.
- `refetchOnWindowFocus` is off; the Refresh control is disabled while a fetch
  is in flight.

The console will adopt any of the above server behaviors immediately: it already
honors `rate_limited`, and would use a real `429` + `Retry-After` to show a
precise back-off and re-enable safe polling once §3.6 lands.

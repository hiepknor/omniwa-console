# OmniWA GO Public Contract

This is the console-facing handoff for the OmniWA GO backend at commit
`7f9e6ac` (2026-07-22). The vendored machine contract at
`contracts/omniwa-go.openapi.json` remains authoritative for paths and schemas;
this document records cross-cutting semantics that generated types cannot
express reliably.

## Authentication and scope

Every request uses exactly one `apikey` header:

- the global admin key for server-wide and instance-lifecycle operations;
- an instance token for WhatsApp-account-scoped reads and mutations.

The browser session may use either key kind. Instance panels build a scoped API
client from the token returned by the instance API. Tokens never enter URLs,
query keys, logs, feedback, or rendered output.

## Capability negotiation

Call `GET /server/capabilities` after login and whenever the selected instance
changes. The same path accepts either credential scope.

```json
{
  "message": "success",
  "data": {
    "version": "...",
    "capabilities": ["rate_limit_retry_after", "groups_projection"]
  }
}
```

Known capabilities:

- `rate_limit_retry_after`
- `groups_projection`
- `labels_projection`
- `contacts_projection`
- `chats_projection`
- `messages_projection`
- `events_projection`
- `outbound_rate_limit`
- `campaign_orchestration`

Unknown capability strings must be preserved for forward compatibility. A
projection capability is an initial-readiness/feature-negotiation signal, not a
replacement for response metadata. At backend commit `7f9e6ac`, resource
capabilities are emitted only while projection state is exactly `ready`, while
a previously reconciled `syncing` or `stale` projection may still serve usable
data. Do not discard a usable snapshot solely because a later capability poll
omits its flag. Do not infer readiness from an empty response array.

## Projection envelope

Projection reads use the compatible success envelope:

```json
{
  "message": "success",
  "data": [],
  "meta": {
    "source": "projection",
    "syncStatus": "ready",
    "lastSyncedAt": "2026-07-22T08:00:00Z",
    "nextCursor": "opaque-value"
  }
}
```

`syncStatus` semantics:

| Status | Console behavior |
| --- | --- |
| `ready` | Render the authoritative result; an empty array is genuinely empty |
| `syncing` | Keep usable projected data and show synchronization state |
| `stale` | Keep data visible and warn about freshness using `lastSyncedAt` |
| `not_started` | Render not-ready state, not an empty list |
| `failed` | Render projection failure; do not substitute a live lookup |

HTTP `503` with code `projection_not_ready` is a resource-read state, not an
empty collection. The console never calls WhatsApp live to compensate.

For an actual projection read, `meta.syncStatus` or
`projection_not_ready` is authoritative. Capability absence must never turn a
cached stale result into an empty/not-implemented state.

`nextCursor` is opaque and may be bound to instance, filter, and query. Never
decode, construct, modify, or reuse it after its scope changes. Default page
size is 50 and the server maximum is 200 unless an endpoint documents otherwise.

Legacy response exception: `GET /label/list` remains a bare array. Do not force
it through the projection envelope adapter. The Groups client temporarily
accepts the historical raw `/group/list` response as well as the current
projection envelope, but never invents readiness metadata for the raw form.

## Projection resources

### Groups

- `GET /group/list`
- `POST /group/info`
- `GET /group/search?q=&limit=&cursor=`

Reads come from PostgreSQL. Search is case-insensitive prefix matching on group
JID and name. Invite-link reads use projection/cache; `reset: true` remains a
live mutation followed by write-through.

### Contacts and labels

- `GET /user/contacts`
- `GET /user/contacts/search?q=&limit=&cursor=`
- `GET /user/contact/{contactId}`
- `GET /label/list`
- `GET /label/info/{labelId}`

Contact search covers JID, names, username, and normalized/redacted phone. A
wildcard is an ordinary character. `/user/check` may return a complete stale
identity result for at most 90 seconds when WhatsApp is rate-limited; it never
returns partial results, and mutations/sends do not use this fallback.

### Chats and messages

- `GET /chat/list`
- `GET /chat/info/{chatId}`
- `GET /chat/{chatId}/messages`
- `GET /message/{messageId}`
- `GET /message/{messageId}/delivery`

Message pagination uses keyset cursors. New messages do not shift pages already
read. Successful sends write through to the projection. Default message
retention is 90 days (`2160h`); media binary is not persisted in projections.

### Durable events

`GET /events?type=&limit=&cursor=` returns normalized, persisted event history.
The type filter is exact and at most 64 characters. Events are stored before
fan-out to WebSocket, webhook, RabbitMQ, or NATS. Retention defaults to 30 days
(`720h`), with no backfill for events lost before persistence existed.

### Overview and health

- `GET /server/overview?window=24h`
- `GET /server/health`
- `GET /server/projection-health`

Overview is computed only from persisted projections and accepts a window up to
720 hours. Health separates API, instance connection, projection, and
rate-limit/circuit-breaker states. The runtime also exposes an undocumented
`GET /server/ok`; it is liveness only, is not part of the vendored contract, and
must not be consumed to infer WhatsApp connection status.

## Errors and rate limits

The shared adapter recognizes:

- `rate_limited`
- `outbound_rate_limited`
- `projection_not_ready`
- `invalid_cursor`
- `invalid_pagination`
- `invalid_filter`
- `invalid_window`
- `not_found`
- campaign HTTP `409` invalid transitions

For HTTP `429`, prefer the `Retry-After` response header and fall back to the
numeric `retryAfter` body field. Reads may expose a countdown and a jittered,
manual retry after cooldown. Mutations are never retried automatically. Known
429 responses must not become generic 500 errors. See `docs/RATE_LIMIT.md`.

## Mutation semantics

The current OmniWA GO endpoints return synchronous HTTP acknowledgements. That
acknowledgement confirms the API command boundary, not WhatsApp delivery or a
campaign recipient outcome.

Important lifecycle, invite-link reset, send, and campaign mutations are not
optimistically applied. Wait for the server response, then invalidate the
narrowest affected projection. Disable duplicate submission while pending.

## Campaign orchestration

Campaign APIs, recipient states, opt-in requirements, worker behavior, and
lifecycle transitions are documented in `docs/CAMPAIGNS.md`.

## Operational defaults

These are conservative deployment defaults, not official WhatsApp limits:

```text
WA_INFO_RATE=5/min
WA_INFO_BURST=3
WA_INFO_MAX_WAIT=5s
WA_INFO_COOLDOWN=90s
WA_GROUP_RECONCILE_INTERVAL=6h
WA_MSG_RETENTION=2160h
WA_EVENT_RETENTION=720h
WA_OUTBOUND_RATE=30/min
WA_OUTBOUND_BURST=5
WA_OUTBOUND_MAX_WAIT=5s
WA_CAMPAIGN_BATCH=10
WA_CAMPAIGN_LEASE=2m
WA_CAMPAIGN_POLL_INTERVAL=1s
WA_CAMPAIGN_MAX_ATTEMPTS=3
WA_CAMPAIGN_RETRY_BASE=30s
```

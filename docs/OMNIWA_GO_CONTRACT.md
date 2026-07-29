# OmniWA GO Public Contract

This is the Console-facing handoff for the OmniWA GO backend at commit
`916e2e78f7753fce06e6511d69ed249763f2b28b` (2026-07-29), described as
`0.7.2-128-g916e2e7`. The vendored machine contract at
`contracts/omniwa-go.openapi.json` remains authoritative for paths and schemas;
this document records cross-cutting semantics that generated types cannot
express reliably.

## Authentication and scope

Every request uses exactly one `apikey` header:

- the global admin key for server-wide and instance-lifecycle operations;
- an instance token for WhatsApp-account-scoped reads and mutations.

The browser session may use either key kind. Ordinary admin list/detail reads
use credential-free instance metadata. Instance panels build a scoped client
only from a one-time create/rotation secret held in memory; a reload clears it.
Tokens never enter resource view models, URLs, query keys, logs, or feedback.

## Capability negotiation

Call `GET /server/capabilities` after login and whenever the selected instance
changes. The same path accepts either credential scope.

```json
{
  "message": "success",
  "data": {
    "version": "...",
    "revision": "...",
    "credentialScope": "instance",
    "instanceId": "0bca2c34-ef2a-463c-98fd-e2afb6978457",
    "capabilities": ["rate_limit_retry_after", "groups_projection"]
  }
}
```

`credentialScope` comes directly from backend authentication and is always
`admin` or `instance` on current revisions. `instanceId` is present only for an
instance credential. The Console uses this field as its primary and sole scope
discovery result; it never derives scope from capability strings, projection
readiness, credential syntax, or failed requests. A successful capability read
remains HTTP 200 when projection-backed capabilities are empty, syncing, stale,
or not ready. HTTP 401 means the supplied credential is missing or invalid.

For a temporary older-backend compatibility window, the Console runs its
sequential `/instance/all` then `/instance/status` probe only after a successful
capability response omits `credentialScope`. The probes are never concurrent,
and an HTTP 401 is not used as admin-versus-instance control flow.

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
- `group_lists`
- `group_list_eligibility`
- `campaign_group_targets`
- `instance_metadata_views`
- `instance_token_rotation`
- `instance_credential_health`
- `canonical_contact_identity`
- `canonical_conversation_identity`
- `conversation_media_assets`

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
    "nextCursor": "opaque-value",
    "total": 245
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
empty collection. The Console never calls WhatsApp live to compensate.

For an actual projection read, `meta.syncStatus` or
`projection_not_ready` is authoritative. Capability absence must never turn a
cached stale result into an empty/not-implemented state.

`nextCursor` is opaque and may be bound to instance, filter, and query. Never
decode, construct, modify, or reuse it after its scope changes. Default page
size is 50 and the server maximum is 200 unless an endpoint documents otherwise.
For Conversation and Contact list/search reads, `meta.total` is the authoritative total
for that request scope; it is never derived from page length. A ready empty
projection reports zero. Search totals do not imply an unfiltered total, and
totals across separately fetched pages are not a snapshot under concurrent writes.

Historical response exception: `GET /label/list` remains a bare array. Do not force
it through the projection envelope adapter. The Groups client temporarily
accepts the historical raw `/group/list` response as well as the current
projection envelope, but never invents readiness metadata for the raw form.

## Projection resources

### Groups

Normalized Group Management is selected per instance, never by probing an
endpoint. `group_management_permissions` selects normalized directory/detail
DTOs; `group_members_projection`, `group_management_commands`,
`group_management_audit`, `group_photo_assets`, and `group_summary` gate their
own surfaces. Capability absence is unavailable/not-ready rather than an empty
projection.

`GET /group/list` is the unfiltered directory. `GET /group/search` owns the
full `q`, `type`, `myRole`, `sendMode`, `state`, and `membershipState` scope.
Directory, members, and audit cursors are opaque and reset whenever their bound
filter scope changes. Detail and members return advisory tri-state actions;
the client enables only `allowed` and never derives permission from role or
provider aliases.

Group detail exposes cached invite-link availability independently from
`readInviteLink` and `resetInviteLink` permission. A missing cached link returns
`group_invite_link_not_found` and is presented as unavailable without retry;
it is not a missing Group or a projection-readiness failure. Reset returns a
typed command acknowledgement and refreshes both detail and cached-link reads.

Management acknowledgements and participant outcomes are public typed facts.
The client preserves partial/unknown results, does not retry automatically,
and does not equate `projectionRefreshExpected` with convergence. Remove,
promote, and demote use opaque member UUIDs; add uses canonical user JIDs.
Photos cross the contract as shared media asset IDs only. Global group metrics
come only from `GET /group/summary`, while audit remains history rather than
current state.

- `GET /group/list`
- `POST /group/info`
- `GET /group/search?q=&type=&myRole=&sendMode=&state=&membershipState=&limit=&cursor=`
- `GET /group/{groupJid}/members?q=&role=&limit=&cursor=`
- `GET /group/{groupJid}/audit?limit=&cursor=`
- `GET /group/summary`

Reads come from PostgreSQL. Search is case-insensitive prefix matching on group
JID and name. Invite-link reads use projection/cache; `reset: true` remains a
live mutation followed by write-through.

Group List selection may use `POST /group-lists/eligibility` for an ordered,
bounded advisory batch and `GET /group-lists/{groupListId}/eligibility` for an
on-demand whole-list aggregate. Both consume the persisted Groups projection
and never call WhatsApp live. `eligible`, `unavailable`, and `unknown` plus the
backend reason are authoritative; the Console never derives them from member
roles. Group List and Campaign mutations validate again and may return bounded
public-safe `details.issues` when state changes after preflight.

### Contacts and labels

- `GET /user/contacts`
- `GET /user/contacts/search?q=&limit=&cursor=`
- `GET /user/contact/{contactId}`
- `GET /label/list`
- `GET /label/info/{labelId}`

When `canonical_contact_identity` is advertised, `contactId` is the sole
person/entity/cache identity and `addressingJid` is the send target. Aliases are
lookup material only. The browser never merges contacts by name, phone text, or
heuristic, including records whose `identityStatus` is `partial`. Detail reads
accept canonical/absorbed IDs and JID aliases but normalize back to the returned
canonical ID. During mixed rollout, historical PascalCase fields remain supported;
canonical fields are ignored until the capability is present.

Contact search covers canonical and absorbed IDs, aliases, JID, names, and
username using backend normalization. A
wildcard is an ordinary character. `/user/check` may return a complete stale
identity result for at most 90 seconds when WhatsApp is rate-limited; it never
returns partial results, and mutations/sends do not use this fallback.

### Conversations and messages

- `GET /conversations`
- `GET /conversations/{conversationRef}`
- `GET /conversations/{conversationRef}/messages`
- `GET /conversations/{conversationRef}/messages/{messageId}`
- `GET /message/{messageId}/delivery`

Projected Conversations carry display names so directory rendering never fetches one
Contact per row. Direct names come from canonical Contact identity; group,
newsletter, and broadcast names come from their type-specific projection. An
absent name renders as unknown rather than exposing a phone/JID-derived label.

Message pagination uses keyset cursors. New messages do not shift pages already
read. Successful sends write through to the projection. Default message
retention is 90 days (`2160h`). Timestamp display uses `providerTimestamp`, then
`sentAt`, then `deliveredAt`; it never invents a timestamp. Media binary is not
persisted in message projections.

`canonical_conversation_identity` is the sole gate for Conversation reads.
`conversationId` is the backend-owned entity, route, and cache identity for every
conversation type. List totals, unread counts, last activity, alias collapse,
PN/LID message aggregation, and provider-message deduplication are authoritative;
the browser performs none of them. Detail and message history accept a canonical
ID or absorbed provider Chat ID and normalize responses to `conversationId`.
`aliases` are lookup material only, `providerChatId` is message provenance only,
and projected `addressingJid` is the provider command target. Cursors remain
opaque and canonical-conversation-scoped; `invalid_cursor` resets only its owning
pagination state. The Console sends no `/chat/*` read fallback when the capability
is absent.

### Conversation media assets

`conversation_media_assets` gates the unified Conversations upload/send/inbound
flow. Neither `group_photo_assets` nor the older image capability flags enable
this flow. Device upload uses authenticated multipart `POST /media-assets` with
one JPEG/PNG `file` and a stable `Idempotency-Key`; Console enforces the 64 MiB
hard ceiling while explaining that the deployment default is 8 MiB and may vary.

Metadata is polled at `GET /media-assets/{mediaId}` only until `ready`, `failed`,
or `deleted`. Authenticated binary content is fetched from
`GET /media-assets/{mediaId}/content` only after ready and is rendered from an
ephemeral browser blob URL. Provider/private URLs never cross the UI boundary.
An incoming projected message remains visible while its asset is pending or
after failure, expiry, or deletion. History-sync media is not downloaded through
the older `/message/downloadmedia` path.

Managed send uses the mutually exclusive `mediaAssetId` branch of
`POST /send/media`; its returned `messageId` and `timestamp` are provider
acknowledgement only. Send is never automatically retried, especially for
`unknown_send_outcome`; delivery comes only from projected status/receipts.

Rollout is capability-observed rather than version-inferred. The Console enables
canonical Contact and Conversation modes independently only while
`canonical_contact_identity` and `canonical_conversation_identity` are respectively
advertised. Private Conversation media remains disabled until
`conversation_media_assets` appears. Console does not infer any of these states
from a version string or migration number.

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
- `media_asset_not_found`
- `media_asset_not_ready`
- `media_asset_failed`
- `media_asset_expired`
- `media_asset_deleted`
- `unsupported_media_asset_type`
- `media_asset_too_large`
- `media_asset_integrity_failed`
- `media_asset_instance_mismatch`
- `media_asset_storage_unavailable`
- `unknown_send_outcome`
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

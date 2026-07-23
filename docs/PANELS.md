# Panel Contracts

This file assigns public OmniWA GO `METHOD /path` operations to console panels
and distinguishes backend availability from frontend integration status.

Rules:

- A feature may call only operations owned by its panel below.
- Shared app/API infrastructure may call operations listed under Shared.
- When a panel needs another operation, update this document in the same PR.
- “Backend available” does not mean the console has integrated the endpoint.
- Unsupported surfaces remain explicit unavailable routes; they are not
  emulated with browser business logic.

## Status overview

| Panel | Backend | Console |
| --- | --- | --- |
| Shared capability/error/projection layer | Available | Integrated |
| Instances | Available | Integrated |
| Groups | Projection available | Projection list/detail/search integrated |
| Chats | Projection available | Projection list/detail integrated |
| Messages and delivery | Projection available | History/detail/receipts and text send integrated |
| Contacts | Projection available | Directory list/search/detail integrated in Chats workspace |
| Labels | Projection available | Directory list/detail integrated in Chats workspace |
| Events | Durable history available | Integrated with retention and no-backfill metadata |
| Overview and Health | Persisted/split APIs available | Integrated in legacy and v2 |
| Projection Recovery | Admin failure operations available | Integrated in v2 |
| Campaigns (`/messages`) | Orchestration available | Integrated |
| Queue/jobs | No generic management API | Unsupported |
| Webhook administration | No management API | Unsupported |
| Global Settings | No global settings API | Unsupported |
| Admin Keys | No key-management API | Unsupported |

## Shared infrastructure

Owner: `src/api/CapabilitiesProvider.tsx`, envelope/error adapters, and app
providers.

```text
GET /server/capabilities
```

The session call negotiates server-wide features. Projection panels use the
same endpoint with the selected instance token. Unknown capabilities remain
preserved.

## Instances — `/instances`, `/instances/:instanceId`

Status: integrated in legacy and v2. V2 uses only the metadata reads approved
for redesign and does not fall back to credential-bearing legacy fleet reads.

```text
GET    /instance/all
GET    /instance/info/{instanceId}
GET    /instance/metadata
GET    /instance/metadata/{instanceId}
GET    /instance/credential-health
POST   /instance/create
POST   /instance/rotate-token/{instanceId}
DELETE /instance/delete/{instanceId}
GET    /instance/status
GET    /instance/qr
POST   /instance/connect
POST   /instance/disconnect
POST   /instance/reconnect
DELETE /instance/logout
GET    /instance/{instanceId}/advanced-settings
PUT    /instance/{instanceId}/advanced-settings
```

Admin operations use the memory-only session client; connection/QR/logout
operations use the instance token. In v2, metadata reads are required when
`instance_metadata_views` is advertised; `/instance/all` and
`/instance/info/{instanceId}` remain legacy-only and are never a v2 fallback.
Credential Health renders factual C3 migration signals, treats zero instances
as non-representative, and never derives a plaintext-removal decision.
`/server/ok` is not connection state.

## Groups — `/groups/:groupId?` (v2), `/groups/:instanceId?` (legacy)

Status: projection list/info/search and mutations integrated in legacy and v2.
V2 uses the active instance credential as its scope and never calls the admin
fleet list. Reads remain available from persisted projection data while the
WhatsApp instance is offline; live mutations still require provider
connectivity.

Reads:

```text
GET  /group/list
GET  /group/search?q=&limit=&cursor=
POST /group/info
POST /group/invitelink        # reset:false is projection/cache read
```

Legacy-only instance picker ownership:

```text
GET /instance/all
```

Mutations:

```text
POST /group/create
POST /group/name
POST /group/description
POST /group/settings
POST /group/participant
POST /group/invitelink        # reset:true is live mutation + write-through
POST /group/leave
POST /send/text
```

Search is prefix-based and cursor-scoped to instance and normalized query.
Changing either resets the cursor. The panel never decodes cursors or falls back
to a live WhatsApp read.

## Chats workspace — `/chats/:chatId?` (v2), `/chats/:instanceId?/:chatId?` (legacy)

Status: Chat and Message list/detail, delivery receipts, Contacts
list/search/detail, Labels list/detail, and bounded text/media sends are
integrated in legacy and v2. V2 uses the active instance credential as its
scope and never calls the admin fleet list.

Core projection ownership:

```text
GET /chat/list
GET /chat/info/{chatId}
GET /chat/{chatId}/messages
GET /message/{messageId}
GET /message/{messageId}/delivery
GET /user/contacts
GET /user/contacts/search?q=&limit=&cursor=
GET /user/contact/{contactId}
GET /label/list
GET /label/info/{labelId}
```

Legacy-only instance picker ownership:

```text
GET /instance/all
```

Contacts use server prefix search and opaque cursors. Labels intentionally keep
the backend's legacy bare-array list; capability readiness distinguishes a valid
empty label projection from an unavailable one. Label assignments are consumed
from future Chat/Message projection fields rather than reconstructed in the
browser.

Legacy Chat pagination is accumulated intentionally. V2 keeps the current Chat
and Message cursors in the URL, renders one bounded page, and uses browser
history or “Start over” rather than decoding a cursor. An invalid opaque cursor
resets its own query to the first page. The public Chat DTO currently has no
label association field, so the Console does not show or infer chat-label
filters. Each message page renders chronologically. Send acknowledgement only
confirms the action response; projected status and per-recipient receipts
remain authoritative for delivery.

Implemented commands owned by the workspace:

```text
POST /send/text
POST /send/media
```

Media send accepts an HTTP(S) URL plus an explicit `image`, `video`,
`audio`, or `document` type. Binary upload and base64 input stay outside the
Console. Like text send, its server acknowledgement is not delivery and an
uncertain failure has no one-click retry.

Additional commands are not owned until their UI is included and verified:

```text
POST /message/react
POST /message/markread
POST /message/markplayed
POST /message/edit
POST /message/delete
POST /chat/archive
POST /chat/unarchive
POST /chat/mute
POST /chat/unmute
POST /chat/pin
POST /chat/unpin
```

## Campaigns — `/messages`, `/messages/new`, `/messages/:campaignId` (v2)

Status: integrated in the current Console and approved for route-level v2
redesign. Full behavior is in `docs/CAMPAIGNS.md`.

All operations in this section use the instance credential. V2 uses the active
instance session directly and never calls the admin fleet list. Pagination
defaults to 50 and is capped at 100.

```text
POST /campaigns
GET  /campaigns
GET  /campaigns/{campaignId}
GET  /campaigns/{campaignId}/recipients
GET  /campaigns/{campaignId}/audit
POST /campaigns/{campaignId}/schedule
POST /campaigns/{campaignId}/start
POST /campaigns/{campaignId}/pause
POST /campaigns/{campaignId}/resume
POST /campaigns/{campaignId}/abort
```

Campaign execution, opt-in enforcement, leases, pacing, and retry stay in
OmniWA GO.

## Events — `/events`

Status: durable history integrated in the current Console and approved for
route-level v2 redesign.

```text
GET /events?type=&limit=&cursor=
```

The endpoint uses the instance credential. V2 uses the active instance session
directly and never calls the admin fleet list. The panel owns history,
filtering, cursor pagination, reconnect recovery, and safe event summaries. It
does not open the admin-key WebSocket.

## Overview — `/overview`

Status: integrated in legacy and v2 with persisted metrics, split health,
URL-backed windows, explicit unavailable action state, and polling-only
realtime posture.

```text
GET /server/overview?window=
GET /server/health
GET /server/projection-health
```

`GET /server/ok` is liveness only and is not used for WhatsApp connection,
projection readiness, or circuit-breaker posture.

The metric window is stored in the URL and is capped by the supported 720-hour
contract. Missing counters remain unreported rather than being coerced to zero.
Instance health dimensions are grouped by the server-provided instance ID.

## Projection Recovery — `/recovery`

Status: integrated behind the v2 generation boundary. The route appears in v2
navigation only for an admin session when capability discovery advertises
`projection_failure_operations`.

```text
GET  /server/projection-failures?instanceId=&resource=&limit=&cursor=
POST /server/projection-failures/replay
POST /server/projection-failures/discard
```

Filters, page size, opaque cursor, and selected failure are URL-backed. These
operations require the admin key and the `projection_failure_operations`
capability. Replay and discard are explicit, audited server commands: Console
does not optimistically remove a failure, automatically retry a command, or
render acknowledgement as recovered state.

## Unsupported routes

The following routes have no equivalent public management API and remain
neutral unavailable surfaces:

- `/queue`
- `/webhooks`, `/webhooks/:webhookId`
- `/settings`
- `/settings/api-keys`

See `docs/UNSUPPORTED_SURFACES.md` for boundaries and future enablement rules.

## Deferred contract boundaries

Operations classified as `deferred-product-workflow`,
`deferred-backend-risk`, or `external-client` have no Console panel owner.
Their accountable decision unit and exit criteria live in
`docs/CONTRACT_BACKLOG.md`. Moving one into Console requires changing its
classification in `scripts/contract-ui-policy.mjs`, assigning it to a panel in
this file, and shipping the complete operator workflow in the same approved
delivery sequence. Mere backend availability does not assign panel ownership.

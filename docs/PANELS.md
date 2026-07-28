# Panel Contracts

This file assigns public OmniWA GO `METHOD /path` operations to Console panels
and distinguishes backend availability from frontend integration status.

Rules:

- A feature may call only operations owned by its panel below.
- Shared app/API infrastructure may call operations listed under Shared.
- When a panel needs another operation, update this document in the same PR.
- “Backend available” does not mean the Console has integrated the endpoint.
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
| Overview and Health | Persisted/split APIs available | Integrated |
| Projection Recovery | Admin failure operations available | Integrated when capability is advertised |
| Campaigns (`/campaigns`) | Orchestration available | Integrated |
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

**Status:** integrated. Fleet views use credential-free metadata reads when the
server advertises `instance_metadata_views`.

```text
GET    /instance/all
GET    /instance/info/{instanceId}
GET    /instance/metadata
GET    /instance/metadata/{instanceId}
GET    /instance/credential-health
POST   /instance/create
POST   /instance/rotate-token/{instanceId}
DELETE /instance/delete/{instanceId}
POST   /instance/disconnect
DELETE /instance/logout
GET    /instance/{instanceId}/advanced-settings
PUT    /instance/{instanceId}/advanced-settings
```

Admin operations use the memory-only session client; disconnect/logout and
advanced settings use the explicitly attached instance token. Metadata reads are required when
`instance_metadata_views` is advertised; `/instance/all` and
`/instance/info/{instanceId}` remain compatible with servers that do not yet
advertise metadata views.
Credential Health renders factual C3 migration signals, treats zero instances
as non-representative, and never derives a plaintext-removal decision.
`/server/ok` is not connection state.

## Active Instance — `/connection`, embedded in `/instances/:instanceId`

**Status:** integrated. Instance-scoped sessions reach the Instance destination
directly; admin sessions use the same surface after attaching the selected
instance token.

```text
GET  /instance/status
GET  /instance/qr
POST /instance/connect
POST /instance/reconnect
```

The QR cache is cleared before every connect/restart attempt and whenever live
status is not connected or is already paired. QR polling runs only while the
pairing surface is mounted, connected, unpaired, and not submitting a command.
An acknowledgement never substitutes for refreshed status.

## Groups and Group Lists — `/groups/:groupId?`, `/groups/lists/:groupListId?`

**Status:** projection list/info/search and mutations integrated. The route uses
the active instance credential as its scope and never calls the admin fleet
list. Reads remain available from persisted projection data while the
WhatsApp instance is offline; live mutations still require provider
connectivity.

Reads:

```text
GET  /group/list
GET  /group/search?q=&limit=&cursor=
POST /group/info
POST /group/invitelink        # reset:false is projection/cache read
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

Group Lists are gated independently by `group_lists`. They are instance-scoped,
versioned target sets; eligibility is consumed from the backend and is never
inferred from participant metadata. Create and edit read Groups projections for
selection and own these operations:

```text
GET    /group-lists
POST   /group-lists
GET    /group-lists/{groupListId}
GET    /group-lists/{groupListId}/groups
PUT    /group-lists/{groupListId}
DELETE /group-lists/{groupListId}
GET    /group-lists/{groupListId}/audit
POST   /group-lists/eligibility
GET    /group-lists/{groupListId}/eligibility
```

When `group_list_eligibility` is advertised, the editor checks only the current
bounded Groups page before selection and the inspector reads an on-demand
whole-list aggregate. Preflight is advisory: writes validate the complete set
again, and structured rejection issues are never converted into client-side
eligibility rules. Older servers retain submit-time validation with an explicit
compatibility notice.

## Chats workspace — `/chats/:chatId?`

**Status:** Chat and Message list/detail, delivery receipts, Contacts
list/search/detail, Labels list/detail, and bounded text/media sends are
integrated. The route uses the active instance credential as its scope and never
calls the admin fleet list.

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

Contacts use server prefix search and opaque cursors. Labels intentionally keep
the backend's historical bare-array list; capability readiness distinguishes a valid
empty label projection from an unavailable one. Label assignments are consumed
from future Chat/Message projection fields rather than reconstructed in the
browser.

The current Chat and Message cursors stay in the URL. Each view renders one
bounded page and uses browser
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

## Campaigns — `/campaigns`, `/campaigns/new`, `/campaigns/:campaignId`

**Status:** integrated. Full behavior is in `docs/CAMPAIGNS.md`.

All operations in this section use the instance credential. The route uses the active
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
OmniWA GO. List rows display backend-returned target and progress snapshots;
the detail drawer displays the complete outcome breakdown plus `statusReason`,
`pauseReason`, `retryAt`, and `needsAttention`. The Console does not recompute
processed totals, trigger retry, or present the current cursor page as a global
footer aggregate.

Campaign creation additionally reads `GET /group-lists`,
`GET /group-lists/{groupListId}`, and `GET /group-lists/{groupListId}/groups`
to select and preview a versioned target. When advertised, it also reads
`GET /group-lists/{groupListId}/eligibility?expectedVersion=` and requires the
exact reviewed version to be ready before submission. New drafts are gated by both
`group_lists` and `campaign_group_targets`; the Console does not create direct
recipient campaigns.

## Events — `/events`

**Status:** durable history integrated in the current Console.

```text
GET /events?type=&limit=&cursor=
```

The endpoint uses the instance credential. The route uses the active instance session
directly and never calls the admin fleet list. The panel owns history,
filtering, cursor pagination, reconnect recovery, and safe event summaries. It
does not open the admin-key WebSocket.

## Overview — `/overview`

**Status:** integrated with persisted metrics, split health,
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

**Status:** integrated. The route appears in navigation only for an admin
session when capability discovery advertises
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
classification in `CONTRACT_UI_MATRIX.md`, assigning it to a panel in this file,
and shipping the complete operator workflow in the same approved delivery
sequence. Mere backend availability does not assign panel ownership.

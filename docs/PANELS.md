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
| Overview and Health | Persisted/split APIs available | Integrated |
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

Status: integrated.

```text
GET    /instance/all
GET    /instance/info/{instanceId}
GET    /instance/metadata
GET    /instance/metadata/{instanceId}
GET    /instance/credential-health
POST   /instance/create
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
operations use the instance token. Metadata reads are preferred when
`instance_metadata_views` is advertised. Credential Health renders factual C3
migration signals, treats zero instances as non-representative, and never
derives a plaintext-removal decision. `/server/ok` is not connection state.

## Groups — `/groups/:instanceId?`

Status: projection list/info/search and mutations integrated. Reads remain
available from persisted projection data while the WhatsApp instance is
offline; live mutations still require provider connectivity.

Reads:

```text
GET  /instance/all
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

## Chats workspace — `/chats/:instanceId?/:chatId?`

Status: Chat and Message list/detail, delivery receipts, Contacts
list/search/detail, Labels list/detail, and text send are integrated. Media and
additional message actions remain unowned and are not exposed as working
behavior.

Core projection ownership:

```text
GET /instance/all
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
the backend's legacy bare-array list; capability readiness distinguishes a valid
empty label projection from an unavailable one. Label assignments are consumed
from future Chat/Message projection fields rather than reconstructed in the
browser.

Chat pagination is accumulated intentionally. An invalid opaque cursor resets
the Chat query to its first page. The public Chat DTO currently has no label
association field, so the Console does not show or infer chat-label filters.
Message history is independently accumulated per chat, newest page first, then
rendered chronologically. Text send acknowledgement only confirms the action
response; projected status and per-recipient receipts remain authoritative for
delivery.

Core commands used by the workspace when implemented:

```text
POST /send/text
POST /send/media
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

The first migration may implement only the core read/send slice. Any additional
command becomes owned when its UI is included and verified.

## Campaigns — `/messages`, `/messages/new`

Status: backend available; console implementation pending. Full behavior is in
`docs/CAMPAIGNS.md`.

All operations in this section use the selected instance token. Pagination
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

Status: durable backend available; console migration pending.

```text
GET /events?type=&limit=&cursor=
```

The endpoint uses the selected instance token. The panel owns history,
filtering, cursor pagination, reconnect recovery, and safe event summaries. It
does not open the admin-key WebSocket.

## Overview — `/overview`

Status: backend available; console migration pending.

```text
GET /server/overview?window=
GET /server/health
GET /server/projection-health
```

`GET /server/ok` is liveness only and is not used for WhatsApp connection,
projection readiness, or circuit-breaker posture.

## Unsupported routes

The following routes have no equivalent public management API and remain
neutral unavailable surfaces:

- `/queue`
- `/webhooks`, `/webhooks/:webhookId`
- `/settings`
- `/settings/api-keys`

See `docs/UNSUPPORTED_SURFACES.md` for boundaries and future enablement rules.

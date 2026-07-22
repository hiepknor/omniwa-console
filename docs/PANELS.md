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
| Chats and Messages | Projection available | Pending migration |
| Contacts | Projection available | Directory list/search/detail integrated in Chats workspace |
| Labels | Projection available | Pending migration |
| Events | Durable history available | Pending migration |
| Overview and Health | Persisted/split APIs available | Pending migration |
| Campaigns (`/messages`) | Orchestration available | Pending implementation |
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

Admin operations use the session client; connection/QR/logout operations use
the instance token. `/server/ok` is not connection state.

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

Status: Contacts list/search/detail is integrated as the directory fallback and
context surface. Chats, Messages, delivery history, and Labels remain pending.

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

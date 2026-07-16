# Panel Contracts

Each panel is one feature directory under `src/features/` and one primary
route. A panel may only call the operation IDs listed for it; the IDs come
verbatim from the public OpenAPI contract (`contracts/omniwa-v1.openapi.json`).

This is the "full resource console" surface: a superset of the frozen
`omniwa-web-dashboard` SDK profile (overview / instances / operations),
extended to parity with the `omniwa-tui` screen surface plus web-appropriate
write operations. When the platform repo next revises the web dashboard
profile in `omniwa-sdk/src/platform_clients.rs`, this table is the input.

Realtime = the panel subscribes to SSE-driven invalidation while mounted.

## overview — `/overview` (realtime)

Landing panel: health, key metrics, action-required list, live event ticker.

Operations: `getDashboardSummary`, `getMetrics`, `getQueueMetrics`,
`getMessageMetrics`, `getWebhookMetrics`, `getMediaMetrics`,
`listActionRequiredItems`, `getHealth`, `getHealthReadiness`, `streamEvents`.

## instances — `/instances`, `/instances/:instanceId` (realtime)

Instance lifecycle: create, connect/disconnect, QR pairing (render QR from
`refreshInstanceQr` on screen), sessions, provider capabilities, destroy.

Operations: `listInstances`, `getInstance`, `createInstance`,
`updateInstance`, `destroyInstance`, `connectInstance`,
`disconnectInstance`, `requestInstanceReconnect`, `refreshInstanceQr`,
`listInstanceSessions`, `getProviderCapabilities`,
`refreshProviderCapabilities`, `streamEvents`.

Destructive actions (`destroyInstance`, `disconnectInstance`) require a
typed confirmation dialog.

## chats — `/instances/:instanceId/chats`

Read-only chat browser with cursor pagination and filtering.

Operations: `listInstanceChats`, `listChats`, `getChat`.

## contacts — `/instances/:instanceId/contacts`

Read-only contact browser.

Operations: `listInstanceContacts`, `listContacts`, `getContact`.

## labels — `/instances/:instanceId/labels`

Read-only label browser.

Operations: `listInstanceLabels`, `listLabels`, `getLabel`.

## groups — `/instances/:instanceId/groups`, `.../groups/:groupId` (realtime)

Group browser and management: members, promote/demote, invite link, local
state, group text send.

Operations: `listInstanceGroups`, `getGroup`, `updateGroup`,
`updateGroupLocalState`, `refreshInstanceGroups`, `refreshGroupInviteLink`,
`listGroupMembers`, `addGroupMember`, `removeGroupMember`,
`promoteGroupMember`, `demoteGroupMember`, `sendGroupTextMessage`,
`streamEvents`.

## messages — `/instances/:instanceId/messages`, `/messages/:messageId`

Message history, delivery timeline, compose (text + media), retry/cancel.
Sending is async-accepted: the UI shows the accepted/queued state and follows
status transitions, never claiming upstream WhatsApp delivery on its own.

Operations: `listInstanceMessages`, `getMessage`,
`getMessageDeliveryHistory`, `sendInstanceTextMessage`,
`sendInstanceMediaMessage`, `sendInstanceMessage`, `retryMessage`,
`cancelMessage`, `registerMedia`, `getMedia`.

## queue — `/queue` (realtime)

Queue status and job browser with job detail drawer.

Operations: `getQueueStatus`, `listJobs`, `getJob`, `streamEvents`.

## webhooks — `/webhooks`, `/webhooks/:webhookId`

Webhook registration and lifecycle (activate/suspend/retire), delivery
history, single and bulk redrive.

Operations: `listWebhooks`, `getWebhook`, `registerWebhook`,
`updateWebhook`, `activateWebhook`, `suspendWebhook`, `retireWebhook`,
`listWebhookDeliveries`, `getWebhookDeliveryHistory`,
`retryWebhookDelivery`, `redriveWebhookDelivery`,
`bulkRedriveWebhookDeliveries`.

## events — `/events` (realtime)

Event history plus live tail, and audit record browser.

Operations: `listEvents`, `streamEvents`, `listAuditRecords`.

## settings — `/settings`

Read settings, validate a proposed settings payload, activate validated
settings.

Operations: `getSettings`, `validateSettings`, `activateSettings`.

## admin-keys — `/settings/api-keys` (admin key required)

API key management. This panel renders only when the session key kind is
admin; with a regular API key it stays hidden and authorization errors are
expected if reached directly.

Operations: `listApiKeys`, `provisionApiKey`, `rotateApiKey`,
`revokeApiKey`.

Provisioned/rotated key secrets are shown exactly once in a copy dialog and
never stored.

## Coverage

Every operation in the v1 contract (77 total) is owned by exactly one panel
above, except `streamEvents`, which is shared by the realtime panels through
the single SSE connection described in `docs/REALTIME.md`.

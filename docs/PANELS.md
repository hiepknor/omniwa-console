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

## chats — `/chats/:instanceId?/:chatId?` (realtime) — PRIMARY

Direct conversations with contacts only (groups are excluded from this
surface). A three-pane messaging workspace: conversation list · bubble
timeline · context panel (contact card, labels, selected-message delivery
timeline). Sending is async-accepted: bubbles render accepted/queued and
follow delivery history — the UI never claims upstream WhatsApp delivery on
its own.

Operations: `listInstanceChats`, `getChat`, `listInstanceMessages`,
`getMessage`, `getMessageDeliveryHistory`, `sendInstanceTextMessage`,
`sendInstanceMediaMessage`, `sendInstanceMessage`, `retryMessage`,
`cancelMessage`, `registerMedia`, `getMedia`, `getContact`, `getLabel`,
`streamEvents`.

## groups — `/groups/:instanceId?/:groupId?`, `/groups/lists` (realtime) — PRIMARY

All WhatsApp groups of the instance in the same three-pane workspace:
group conversations with sender attribution, group management in the
context panel (members promote/demote/remove, invite link, local state),
plus the **Send lists** tab — create/edit/retire recipient lists used by
Bulk messages (send-list operations are proposed contract, see below).

Operations: `listInstanceGroups`, `getGroup`, `updateGroup`,
`updateGroupLocalState`, `refreshInstanceGroups`, `refreshGroupInviteLink`,
`listGroupMembers`, `addGroupMember`, `removeGroupMember`,
`promoteGroupMember`, `demoteGroupMember`, `sendGroupTextMessage`,
`getMessage`, `getMessageDeliveryHistory`, `streamEvents` — plus proposed
`listSendLists`, `createSendList`, `getSendList`, `updateSendList`,
`retireSendList`.

## directory — `/directory/:instanceId?`

Read-only contact and label directory for the messaging workflow: search a
contact or label, then jump into its chat. Labels are synced projections —
the API exposes no create/assign operations, so the directory renders them
as filters and badges only. Send lists are built from these rows.

Operations: `listInstanceContacts`, `listContacts`, `getContact`,
`listInstanceLabels`, `listLabels`, `getLabel`, `listChats`,
`listInstanceChats`.

## bulk-messages — `/bulk-messages`, `/bulk-messages/new` — PROPOSED

Campaign management and send setup: campaign table with segmented outcome
progress, 3-step creation wizard (Audience → Message → Review), pause /
resume / abort. **No v1 operations exist for this panel** — it is a
proposed platform contract extension documented in
`docs/CAMPAIGNS_PROPOSAL.md` (proposed operation IDs: `listCampaigns`,
`createCampaign`, `getCampaign`, `listCampaignRecipients`,
`pauseCampaign`, `resumeCampaign`, `abortCampaign`). The prototypes exist
to validate the UX and to drive the contract proposal; the panel must not
ship by looping `send*` operations client-side (business logic stays
platform-side per the Phase J guardrail).

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

Every operation in the v1 contract (77 total) is owned by at least one panel
above; `streamEvents` is shared by the realtime panels through the single
SSE connection described in `docs/REALTIME.md`, and the read operations for
contacts/labels/chats are shared between `workspace` and `directory`. The
`campaigns + send-lists` panel references proposed (not yet existing)
operations only.

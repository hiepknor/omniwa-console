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

Contact and label lookup lives here too: the conversation-list search
matches contacts, and labels (read-only synced projections) act as
filters — there is no separate directory panel.

Operations: `listInstanceChats`, `listChats`, `getChat`,
`listInstanceMessages`, `getMessage`, `getMessageDeliveryHistory`,
`sendInstanceTextMessage`, `sendInstanceMediaMessage`,
`sendInstanceMessage`, `retryMessage`, `cancelMessage`, `registerMedia`,
`getMedia`, `listInstanceContacts`, `listContacts`, `getContact`,
`listInstanceLabels`, `listLabels`, `getLabel`, `requestInstanceReconnect`,
`streamEvents`.

## groups — `/groups/:instanceId?` (realtime) — PRIMARY

Management table of groups loaded from the selected instance, with projected
metadata (name, ID, member/admin counts, local state, lifecycle status, and
projection update time). Search and status filtering apply only to loaded
pages because the v1 read has no server-side filters. A row opens a detail
drawer for metadata, local state, member commands, invite-link refresh
acceptance, and a one-off "Send text…" command. The console renders member
roles as supplied and leaves command authorization to the platform; it does
not infer operator capabilities from free-form role values.

Named List membership, bulk selection, the operator's own role, and true
group last-activity time remain blocked on public-contract additions tracked
in `docs/M6_CONTRACT_GAPS.md`. They are not emulated locally. Recurring sends
belong to the proposed Messages campaigns surface.

Operations: `listInstances`, `listInstanceGroups`, `getGroup`, `updateGroup`,
`updateGroupLocalState`, `refreshInstanceGroups`, `refreshGroupInviteLink`,
`listGroupMembers`, `addGroupMember`, `removeGroupMember`,
`promoteGroupMember`, `demoteGroupMember`, `sendGroupTextMessage`,
`streamEvents` — plus proposed `listNamedLists`, `createNamedList`,
`getNamedList`, `updateNamedList`, `deleteNamedList`.

## messages — `/messages`, `/messages/new` — PROPOSED

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
SSE connection described in `docs/REALTIME.md`. The `messages` panel
(campaigns) and the Named Lists panel mode of `groups` reference proposed
(not yet existing) operations only.

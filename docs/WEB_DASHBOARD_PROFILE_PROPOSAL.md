# Web Dashboard SDK Profile — Revision Proposal

Status: **proposal**. This document proposes a revision to the frozen
`omniwa-web-dashboard` profile in
`omniwa-sdk/src/platform_clients.rs` in the platform repository.

## Motivation

`docs/PANELS.md` declares the console surface to be a superset of the frozen
SDK profile and names `platform_clients.rs` as the input for its next
revision. The console has now shipped all nine contract-backed panels, while
the current profile exposes only three surfaces (`overview`, `instances`, and
`operations`) and 17 read-only operations.

The SDK profile should now mirror the shipped panel boundaries. That makes
profile discovery accurately describe what the web dashboard consumes and
keeps operation ownership aligned with the console's authoritative panel
contract.

## Proposed operation sets

The following constants copy the operation IDs from `docs/PANELS.md`
verbatim. The profile should use the same module-level `&[&str]` structure as
the existing Rust implementation.

```rust
const WEB_OVERVIEW_OPERATIONS: &[&str] = &[
    "getDashboardSummary",
    "getMetrics",
    "getQueueMetrics",
    "getMessageMetrics",
    "getWebhookMetrics",
    "getMediaMetrics",
    "listActionRequiredItems",
    "getHealth",
    "getHealthReadiness",
    "streamEvents",
];

const WEB_INSTANCES_OPERATIONS: &[&str] = &[
    "listInstances",
    "getInstance",
    "createInstance",
    "updateInstance",
    "destroyInstance",
    "connectInstance",
    "disconnectInstance",
    "requestInstanceReconnect",
    "refreshInstanceQr",
    "listInstanceSessions",
    "getProviderCapabilities",
    "refreshProviderCapabilities",
    "streamEvents",
];

const WEB_CHATS_OPERATIONS: &[&str] = &[
    "listInstanceChats",
    "listChats",
    "getChat",
    "listInstanceMessages",
    "getMessage",
    "getMessageDeliveryHistory",
    "sendInstanceTextMessage",
    "sendInstanceMediaMessage",
    "sendInstanceMessage",
    "retryMessage",
    "cancelMessage",
    "registerMedia",
    "getMedia",
    "listInstanceContacts",
    "listContacts",
    "getContact",
    "listInstanceLabels",
    "listLabels",
    "getLabel",
    "requestInstanceReconnect",
    "streamEvents",
];

const WEB_GROUPS_OPERATIONS: &[&str] = &[
    "listInstances",
    "listInstanceGroups",
    "getGroup",
    "updateGroup",
    "updateGroupLocalState",
    "refreshInstanceGroups",
    "refreshGroupInviteLink",
    "listGroupMembers",
    "addGroupMember",
    "removeGroupMember",
    "promoteGroupMember",
    "demoteGroupMember",
    "sendGroupTextMessage",
    "streamEvents",
];

const WEB_QUEUE_OPERATIONS: &[&str] = &[
    "getQueueStatus",
    "listJobs",
    "getJob",
    "streamEvents",
];

const WEB_WEBHOOKS_OPERATIONS: &[&str] = &[
    "listWebhooks",
    "getWebhook",
    "registerWebhook",
    "updateWebhook",
    "activateWebhook",
    "suspendWebhook",
    "retireWebhook",
    "listWebhookDeliveries",
    "getWebhookDeliveryHistory",
    "retryWebhookDelivery",
    "redriveWebhookDelivery",
    "bulkRedriveWebhookDeliveries",
];

const WEB_EVENTS_OPERATIONS: &[&str] = &[
    "listEvents",
    "streamEvents",
    "listAuditRecords",
];

const WEB_SETTINGS_OPERATIONS: &[&str] = &[
    "getSettings",
    "validateSettings",
    "activateSettings",
];

const WEB_ADMIN_KEYS_OPERATIONS: &[&str] = &[
    "listApiKeys",
    "provisionApiKey",
    "rotateApiKey",
    "revokeApiKey",
];
```

Campaign operations and Named Lists operations are deliberately excluded.
They are proposed-only, do not exist in the v1 OpenAPI contract, and remain
blocked as described in `docs/CAMPAIGNS_PROPOSAL.md`. In particular, this
proposal does not include `listCampaigns`, `createCampaign`, `getCampaign`,
`listCampaignRecipients`, `pauseCampaign`, `resumeCampaign`,
`abortCampaign`, `listNamedLists`, `createNamedList`, `getNamedList`,
`updateNamedList`, or `deleteNamedList`.

## Proposed surfaces

The surface IDs, titles, realtime flags, and operation sets should be:

```rust
surface(
    "overview",
    "Overview",
    PlatformClientSurfaceKind::DashboardPanel,
    WEB_OVERVIEW_OPERATIONS,
    true,
),
surface(
    "instances",
    "Instances",
    PlatformClientSurfaceKind::DashboardPanel,
    WEB_INSTANCES_OPERATIONS,
    true,
),
surface(
    "chats",
    "Chats",
    PlatformClientSurfaceKind::DashboardPanel,
    WEB_CHATS_OPERATIONS,
    true,
),
surface(
    "groups",
    "Groups",
    PlatformClientSurfaceKind::DashboardPanel,
    WEB_GROUPS_OPERATIONS,
    true,
),
surface(
    "queue",
    "Queue",
    PlatformClientSurfaceKind::DashboardPanel,
    WEB_QUEUE_OPERATIONS,
    true,
),
surface(
    "webhooks",
    "Webhooks",
    PlatformClientSurfaceKind::DashboardPanel,
    WEB_WEBHOOKS_OPERATIONS,
    false,
),
surface(
    "events",
    "Events",
    PlatformClientSurfaceKind::DashboardPanel,
    WEB_EVENTS_OPERATIONS,
    true,
),
surface(
    "settings",
    "Settings",
    PlatformClientSurfaceKind::DashboardPanel,
    WEB_SETTINGS_OPERATIONS,
    false,
),
surface(
    "admin-keys",
    "Admin Keys",
    PlatformClientSurfaceKind::DashboardPanel,
    WEB_ADMIN_KEYS_OPERATIONS,
    false,
),
```

These surfaces remain wrapped by the existing profile declaration:

```rust
profile(
    PlatformClientKind::WebDashboard,
    "omniwa-web-dashboard",
    "OmniWA Web Dashboard",
    SURFACES,
)
```

## Summary diff

| Surface | Current profile | Proposed entries | Revision |
| --- | ---: | ---: | --- |
| `overview` | Present | 10 | Keep the ID; expand to the complete Overview panel ownership. |
| `instances` | Present | 13 | Keep the ID; add lifecycle commands, QR, sessions, capabilities, and realtime. |
| `chats` | Absent | 21 | Add the shipped Chats workspace, including messages, contacts, labels, media, and realtime. |
| `groups` | Absent | 14 | Add contract-backed group management and realtime; exclude Named Lists. |
| `queue` | In aggregate `operations` | 4 | Split queue and job ownership into its shipped panel. |
| `webhooks` | In aggregate `operations` | 12 | Split webhook lifecycle and delivery ownership into its shipped panel. |
| `events` | In aggregate `operations` | 3 | Split event history, live tail, and audit ownership into its shipped panel. |
| `settings` | Absent | 3 | Add settings read, validation, and activation. |
| `admin-keys` | Absent | 4 | Add admin-scoped API-key lifecycle operations. |
| **Total** | **3 surfaces; 17 distinct operations** | **9 surfaces; 84 surface-operation entries, 77 distinct operations** | **Add 6 surfaces and cover the complete current v1 contract.** |

The 84 entries contain 77 distinct operation IDs. `streamEvents` is shared
across the six realtime surfaces exactly as `docs/PANELS.md` describes;
`listInstances` is shared by Instances and Groups, and
`requestInstanceReconnect` is shared by Instances and Chats. Counting each
operation once, the revision grows the profile from 17 to 77 operations, a
net addition of 60.

## Compatibility

The existing `overview` and `instances` surface IDs remain stable. The
existing `operations` surface is superseded by the narrower `queue`,
`webhooks`, and `events` surfaces. Removing or renaming `operations` is the
one breaking surface-ID change in this proposal.

If downstream profile consumers require a migration window, retain
`operations` as a deprecated aggregate alias over the Queue, Webhooks, and
Events operation sets. New consumers should use the three panel-aligned
surface IDs, and the alias can be removed in the next profile-breaking
revision.

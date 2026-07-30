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
| Groups | Normalized management available | Capability-gated directory, detail, members, commands, photo, audit, and summary integrated |
| Conversations | Canonical projection available | Projection list/detail integrated |
| Messages and delivery | Projection available | History/detail/receipts and text send integrated |
| Contacts | Projection available | Directory list/search/detail integrated in Conversations workspace |
| Labels | Projection available | Directory list/detail integrated in Conversations workspace |
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

The session call negotiates server-wide features and returns the authenticated
`credentialScope`; instance scope also carries `instanceId`. Connect uses that
field directly and sends no admin or status probe when it is present. A
temporary sequential compatibility probe remains only for successful responses
from older revisions that omit the field. Unknown capabilities remain
preserved, and projection panels use the same endpoint with the selected
instance token.

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
as non-representative, preserves missing counters as unreported, and never
derives a plaintext-removal decision. Missing metadata connection facts remain
`unknown` rather than disconnected. Advanced settings use a full-snapshot PUT;
editing is disabled unless every current setting is reported, preventing an
unknown value from being overwritten. Create and rotation tokens are one-time
reveals whose implicit dismissal is locked until the operator explicitly stores
or confirms discarding the reveal.
`/server/ok` is not connection state.

## Active Connection — `/connection`, embedded in `/instances/:instanceId`

**Status:** integrated. Instance-scoped sessions reach the pinned Connection destination
directly; admin sessions use the same surface after attaching the selected
instance token.

```text
GET  /instance/status
GET  /instance/qr
POST /instance/connect
POST /instance/reconnect
POST /instance/disconnect
DELETE /instance/logout
```

The QR cache is cleared before every connect/restart attempt and whenever live
status is not connected or is already paired. QR polling runs only while the
pairing surface is mounted, connected, unpaired, and not submitting a command.
Connect, reconnect, disconnect, and logout fail closed when either live status
boolean is missing or its latest refresh failed. An acknowledgement never
substitutes for refreshed status. Instance scope does
not expose or infer the configured admin Instance Name. The status `Name` is
rendered as WhatsApp name only after authoritative status reports `LoggedIn` and
the value is non-empty; `Connected` does not gate it. During a failed refresh,
cached identity may remain visible only with the standard stale-data notice.
The backend-authenticated `instanceId` is the stable identity and query scope;
older revisions that omit it render the identity as unreported rather than
inferring it. A successful but incomplete status snapshot is an explicit error,
not an endless loading state. Disconnect and logout require exact-target
confirmation and cannot overlap another lifecycle command. QR remains the
primary pairing surface; contract-supplied passkey codes and validated HTTPS
open URLs render as an alternate pairing method when present.

## Groups and Group Lists — `/groups/:groupId?`, `/groups/lists/:groupListId?`

**Status:** normalized Group Management integrated with a capability-based
cutover. The route uses
the active instance credential as its scope and never calls the admin fleet
list. Reads remain available from persisted projection data while the
WhatsApp instance is offline; live mutations still require provider
connectivity.

The normalized surfaces require their corresponding instance capability:
`group_management_permissions`, `group_members_projection`,
`group_management_commands`, `group_management_audit`, `group_photo_assets`,
and `group_summary`. A missing capability is unavailable/not-ready, never an
empty result. The compatibility directory may remain visible when only
`groups_projection` is advertised, but it never enables normalized actions or
infers permissions.

Reads:

```text
GET  /group/list
GET  /group/search?q=&type=&myRole=&sendMode=&state=&membershipState=&limit=&cursor=
POST /group/info
POST /group/invitelink        # reset:false is projection/cache read
GET  /group/{groupJid}/members?q=&role=&limit=&cursor=
GET  /group/{groupJid}/audit?limit=&cursor=
GET  /group/summary
GET  /media-assets/{mediaId}
GET  /media-assets/{mediaId}/content
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
POST /group/join
POST /group/photo
POST /media-assets
```

`/group/list` is the unfiltered normalized directory; `/group/search` owns the
complete filter scope. Directory, members, and audit cursors are opaque and
bound to their full instance/resource/filter scopes. Changing a search or
filter resets its cursor. The panel never decodes cursors or falls back to a
live WhatsApp read.

Detail and member actions use backend tri-state decisions. Only `allowed`
enables a command; `denied` and `unknown` remain disabled with their reason.
Invite-link read permission and cached-link availability are separate detail
facts. `group_invite_link_not_found` is an expected unavailable state without
automatic retry; it remains distinct from `group_not_found` and
`projection_not_ready`. Reset remains independently permission-gated and
returns a typed acknowledgement.
Participant remove/promote/demote commands use opaque `memberId` values, while
add uses canonical user JIDs. Per-participant partial and unknown outcomes are
rendered individually. Management mutations carry an idempotency key, are
never auto-retried, and treat acknowledgement and projection convergence as
different facts. HTTP 429 remains operator-controlled and preserves
`Retry-After` through the shared failure surface.

Group photo uses shared media ownership: upload a JPEG/PNG to `/media-assets`,
poll only that asset until terminal state, then send its opaque ID to
`/group/photo`. Existing managed content is fetched through the authenticated
API client; the browser never constructs a storage URL. `/group/summary` alone
owns global metrics; the current directory page is never aggregated into a
global total. Audit is terminal history and never a source of current state.

The Groups directory distinguishes projected group state from WhatsApp send
mode and does not infer the active account's management permissions or campaign
eligibility. Its URL-backed inspector owns overview, member, and settings
contexts. One-off messaging is handed to the Conversations workspace, and campaign
target management is handed to Group Lists; Groups does not own a send command.

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
compatibility notice. Target rows show projected `memberCount` independently
from eligibility, preserve an unreported count as `—`, and place normalized
group type beside the stable Group JID. The Console never expands members,
aggregates counts into unique recipients, or uses member count to enable a row.

## Conversations workspace — `/conversations/:conversationRef?`

**Status:** canonical Conversation and Message list/detail, delivery receipts, Contacts,
Labels, authoritative totals, and bounded text/private-media sends are
integrated. The route uses the active instance credential as its scope and never
calls the admin fleet list.

Core projection ownership:

```text
GET /conversations
GET /conversations/{conversationRef}
GET /conversations/{conversationRef}/messages
GET /conversations/{conversationRef}/messages/{messageId}
GET /message/{messageId}/delivery
GET /user/contacts
GET /user/contacts/search?q=&limit=&cursor=
GET /user/contact/{contactId}
GET /label/list
GET /label/info/{labelId}
GET /media-assets/{mediaId}
GET /media-assets/{mediaId}/content
```

With `canonical_contact_identity`, Contacts use returned `contactId` as identity
and `addressingJid` for sends; aliases never become duplicate rows or a browser
merge heuristic. A canonical row without `addressingJid` fails closed: the
Composer stays disabled and exposes the Contact read failure/retry instead of
falling back to a compatibility alias. Projected Conversation names prevent list-level Contact fan-out.
Contacts use normalized server search and opaque cursors. Conversation and Contact
counts use `meta.total`, while Labels intentionally use bare-array length.
Labels intentionally keep
the backend's historical bare-array list; capability readiness distinguishes a valid
empty label projection from an unavailable one. Label assignments are consumed
from future Conversation/Message projection fields rather than reconstructed in the
browser.

The current Conversation and Message cursors stay in the URL. Each view renders one
bounded page and uses browser
history or `Newest` rather than decoding a cursor. Message pagination names the
next direction `Older messages`; it never calls a page replacement `Load more`.
An invalid opaque cursor
resets its own query to the first page. The public Conversation DTO currently has no
label association field, so the Console does not show or infer chat-label
filters. Each message page renders chronologically across the full detail pane,
aligns incoming/outgoing messages to opposite edges, caps bubble line length,
and preserves day separators plus explicit incoming/outgoing/system direction. A
newest page anchors to its end; an older cursor page starts at its beginning,
and appended messages follow only while the operator remains near the end.
Missing text is reported as missing rather than rendered as a type token. Group
participants remain unidentified in the timeline until the public projection
publishes authoritative participant display identity; Console never derives it
from JID or Contact matching. Conversation and Messages ready states may share
one scoped status row, but differing/non-ready states remain separate. Send acknowledgement only
confirms the action response; projected status and per-recipient receipts
remain authoritative for delivery.

`canonical_conversation_identity` is the sole Conversation-read capability.
Rows use returned `conversationId` as route/entity/cache identity, normalize
absorbed provider deep links, and send only to projected `addressingJid`.
`aliases` never become browser rows and message `providerChatId` is provenance
only. The backend owns alias collapse, message aggregation/deduplication, unread,
last activity, totals, and cursor scope; Console performs no grouping or Contact
matching. Capability-off instances receive no `/chat/*` fallback read. Former
browser URLs and their cursors are not supported by the canonical workspace.
`conversation_media_assets` remains an independent gate.

The selected Conversation keeps unread and type in the timeline summary. At
1560px of actual workspace width, backend-reported identity, provider routing,
and projected state persist in a non-modal 440px third inspector column; selected
Message details replace that content and closing them restores Conversation
details. Desktop below that threshold, tablet, and mobile use the shared
Drawer/Panel/DescriptionList composition through the URL-backed `details` or
`message` state. Raw aliases and addressing JID remain inside that inspector,
and diagnostic identifiers use the shared copy action. If
the authoritative command target or required send capabilities are unavailable,
the Composer is replaced by one compact unavailable notice rather than a disabled
form. Canonical Contacts preserve absent `Found` as unreported and never derive a
canonical display name from compatibility fields.

Implemented commands owned by the workspace:

```text
POST /send/text
POST /send/media
POST /media-assets
```

When `conversation_media_assets` is advertised, Conversations uploads a local
JPEG/PNG, polls shared private metadata, fetches authenticated content only when
ready, and sends the mutually exclusive `mediaAssetId` image branch. Pending,
failed, expired, and deleted inbound assets preserve their projected message
placeholder. Timeline metadata/content reads are near-viewport gated, metadata
polling backs off while non-terminal, and binary cache entries are short-lived.
A content `media_asset_not_ready` race remains pending and retries only within a
bounded read policy; the inspector offers an explicit retry for recoverable
reads. `group_photo_assets` and older image flags do not enable this
flow. The HTTP(S) URL branch remains a compatibility option. Like text send,
provider acknowledgement is not delivery; `unknown_send_outcome` has no
automatic or one-click retry. A reported outbound `Retry-After` disables both
send actions until its countdown ends and never auto-submits.

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
The active authenticated credential scope controls presentation only: instance
scope identifies its runtime snapshot without requesting configured fleet
metadata and omits the admin-only Recovery surface. It does not filter or infer
server results in the browser. Failed background refreshes keep usable snapshots
visible with an explicit last-known-data notice.
In instance scope, the health row labels `connection` as the transport snapshot
it represents. Pairing (`LoggedIn`) remains a separate live fact owned by
`/connection`; Overview does not call `GET /instance/status` or imply that a
paired account must currently have a connected transport.

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
render acknowledgement as recovered state. A failed capability refresh may
leave the cached failure directory inspectable, but replay/discard remain
disabled. The shared inspector preserves the full event key in its fact list and
separates audited actions from failure identity and status.

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

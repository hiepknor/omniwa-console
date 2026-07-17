# Campaigns & Send Lists — Platform Contract Proposal

Status: **proposal**. Nothing in this document exists in the v1 OpenAPI
contract. The console prototypes (`design/prototypes/campaigns.html`,
`campaign-new.html`, `lists.html`) validate the UX; shipping the feature
requires the platform to expose the operations below.

## Positioning conflict to resolve first

OmniWA's own product scope currently states it is **not** a campaign or
broadcast tool (README/VISION non-goals). This proposal narrows the feature
to *opt-in notification sends to existing relationships* — but adopting it
is a product-scope decision for the platform, and the frozen scope docs
must be amended there before implementation. The console will not ship the
panel until the platform contract exists.

## Why platform-side (not console-side)

Looping `sendInstanceTextMessage` from the browser would:

- put business logic in a client (Phase J guardrail violation),
- bypass queue pacing, retries, and observability,
- die with the browser tab mid-campaign.

Campaign execution belongs in the platform's existing worker/queue runtime;
the console only orchestrates and observes through the API.

## Responsible-use guardrails (baked into the contract, not the UI)

1. **Members come from existing contacts/chats only.** `createSendList`
   accepts contact/chat resource IDs — there is no raw-phone-number input
   anywhere in the contract, so cold lists cannot be constructed.
2. **Pacing is platform-enforced** from the active settings rate limits;
   the API rejects a requested rate above the configured cap.
3. **Auto-pause on failure spike** (threshold in settings): a campaign that
   starts failing pauses itself and surfaces an action-required item.
4. **Honest accounting**: per-recipient outcomes are the standard message
   lifecycle (`accepted / queued / delivered / failed / canceled`) — a
   campaign never reports "sent" as a terminal state.
5. **Auditability**: create/pause/resume/abort emit audit records and
   events like every other command.

## Proposed resources & operations

### SendList

`sl_*` — name, instance scope, member count, created/updated, state
(`active | retired`).

| Operation | Method & path | Notes |
| --- | --- | --- |
| `listSendLists` | `GET /v1/send-lists` | Cursor pagination, filter by instance |
| `createSendList` | `POST /v1/send-lists` | Name + instance + member resource IDs |
| `getSendList` | `GET /v1/send-lists/{listId}` | Includes member page |
| `updateSendList` | `PATCH /v1/send-lists/{listId}` | Rename, add/remove member IDs |
| `retireSendList` | `POST /v1/send-lists/{listId}/retire` | Lists referenced by campaigns are retired, never deleted |

### Campaign

`cmp_*` — name, instance, send list, message template (text or media ref),
pacing (msgs/min ≤ platform cap), schedule (now | at), state
(`draft | scheduled | running | paused | completed | aborted`), counters
(`total / accepted / delivered / failed / canceled`).

| Operation | Method & path | Notes |
| --- | --- | --- |
| `listCampaigns` | `GET /v1/campaigns` | Cursor pagination |
| `createCampaign` | `POST /v1/campaigns` | Draft or scheduled; validates list + pacing |
| `getCampaign` | `GET /v1/campaigns/{campaignId}` | Counters + state |
| `listCampaignRecipients` | `GET /v1/campaigns/{campaignId}/recipients` | Per-recipient message ID + lifecycle status |
| `pauseCampaign` | `POST /v1/campaigns/{campaignId}/pause` | Running → paused |
| `resumeCampaign` | `POST /v1/campaigns/{campaignId}/resume` | Paused → running |
| `abortCampaign` | `POST /v1/campaigns/{campaignId}/abort` | Terminal; typed confirmation in UI |

### Events (for SSE invalidation)

`campaign.started`, `campaign.progress`, `campaign.paused`,
`campaign.auto_paused`, `campaign.completed`, `campaign.aborted`.

## Console UX summary

- **Send lists** (`/groups/lists`, the Send lists tab of Groups): table +
  drawer; members added by picking from
  the instance's directory (search contacts/chats), never by import.
- **New campaign** (`/bulk-messages/new`): 3-step wizard — Audience (pick list,
  see resolved member count) → Message (text/media, preview as workspace
  bubble) → Review (pacing capped by settings, estimated duration, explicit
  accepted≠delivered note) → create as draft or schedule.
- **Bulk messages** (`/bulk-messages`): table with segmented progress bars
  (delivered/queued/failed always distinguishable) + drawer with counters,
  per-recipient table (each row links to the workspace conversation),
  pause/resume, abort with typed confirmation.

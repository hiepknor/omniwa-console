# Campaigns & Named Lists — Platform Contract Proposal

Status: **proposal**. Nothing in this document exists in the v1 OpenAPI
contract. The console prototypes (`design/prototypes/campaigns.html`,
`campaign-new.html`, `lists.html` — the Named Lists tab) validate the UX; shipping the feature
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

1. **Members come from existing contacts/chats only.** `createNamedList`
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

### NamedList

`nl_*` — name, instance scope, member count, created/updated.

| Operation | Method & path | Notes |
| --- | --- | --- |
| `listNamedLists` | `GET /v1/named-lists` | Cursor pagination, filter by instance |
| `createNamedList` | `POST /v1/named-lists` | Name + instance + member resource IDs |
| `getNamedList` | `GET /v1/named-lists/{listId}` | Includes member page |
| `updateNamedList` | `PATCH /v1/named-lists/{listId}` | Rename, add/remove member IDs |
| `deleteNamedList` | `DELETE /v1/named-lists/{listId}` | Rejected while a scheduled/running campaign references the list; campaigns snapshot recipients at start, so past campaigns are unaffected |

### Campaign

`cmp_*` — name, instance, Named List (recipients snapshotted at start), message template (text or media ref),
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

- **Named Lists** (`/groups/named-lists`, the Named Lists tab of Groups):
  table + drawer; members added by picking existing contacts/chats of the
  instance, never by import. Add/edit/delete with the reference guard above.
- **New campaign** (`/messages/new`): 3-step wizard — Audience (pick list,
  see resolved member count) → Message (text/media, preview as workspace
  bubble) → Review (pacing capped by settings, estimated duration, explicit
  accepted≠delivered note) → create as draft or schedule.
- **Messages** (`/messages`): table with segmented progress bars
  (delivered/queued/failed always distinguishable) + drawer with counters,
  per-recipient table (each row links to the workspace conversation),
  pause/resume, abort with typed confirmation.

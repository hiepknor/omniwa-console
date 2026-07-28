# Campaign Integration Contract

**Status:** backend and Console integration available.

Campaign execution belongs entirely to OmniWA GO. The Console creates, schedules,
controls, and observes campaigns through the public API. It never loops over
recipients, implements pacing, retries sends, or persists campaign state in the
browser.

All campaign operations require the selected instance token. List, recipient,
and audit page sizes default to 50 and are capped at 100.

## Capability

Gate the UI with `campaign_orchestration`. Outbound rate posture is separately
advertised by `outbound_rate_limit`.

## API ownership

```text
POST /campaigns
GET  /campaigns?status=&limit=&cursor=
GET  /campaigns/{campaignId}
GET  /campaigns/{campaignId}/recipients?limit=&cursor=
GET  /campaigns/{campaignId}/audit?limit=&cursor=
POST /campaigns/{campaignId}/schedule
POST /campaigns/{campaignId}/start
POST /campaigns/{campaignId}/pause
POST /campaigns/{campaignId}/resume
POST /campaigns/{campaignId}/abort
```

All cursors are opaque. Invalid lifecycle transitions return HTTP `409` and
must remain visible as conflict errors.

## Creation and Group List targets

New Console campaigns select one server-owned Group List version:

```json
{
  "name": "July campaign",
  "text": "Message content",
  "target": {
    "type": "group_list",
    "groupListId": "4cae2734-b8f4-4faa-8d09-5933ef3bf1b0",
    "groupListVersion": 4
  }
}
```

The backend locks and snapshots the list, validates every group, and rejects a
stale reviewed version. Existing direct campaigns remain readable, but the
Console no longer creates them.

## State machines

Campaign status:

- `draft`
- `scheduled`
- `running`
- `paused`
- `completed`
- `aborted`
- `failed`

Scheduling is optional. A newly created draft supports either path:

```text
draft ── start ──────────────> running
  └──── schedule ─> scheduled ── start ─> running
```

The Console offers `schedule`, `start`, and `abort` for a draft; `start` and
`abort` for a scheduled campaign; `pause` and `abort` while running; and
`resume` and `abort` while paused. Completed, aborted, and failed campaigns are
terminal in the Console. The server still validates every transition and a
conflict response remains authoritative.

Recipient status:

- `pending`
- `processing`
- `sent`
- `delivered`
- `read`
- `failed`
- `skipped`
- `aborted`

Do not collapse `sent`, `delivered`, and `read`. An API acknowledgement is not a
recipient outcome.

## Progress and operational state

Campaign list and detail responses expose the same backend-owned monitoring
facts: `target`, `progress`, `statusReason`, `pauseReason`, `retryAt`, and
`needsAttention`. The Console displays `progress.processed` against
`progress.total` without recomputing it from recipient rows. The backend defines
`processed` as the sum of terminal outcomes; `pending` and `processing` remain
non-terminal.

The directory renders a compact per-campaign progress bar. The drawer renders
the complete outcome breakdown and target snapshot. `needsAttention` is an
operator warning, while `retryAt` is an informational backend retry window; the
Console never starts a retry timer or submits a retry command. A global campaign
footer is deliberately omitted because one cursor page is not a fleet-wide
aggregate and presenting it as one would be misleading.

## Worker guarantees and UI implications

The backend provides a durable queue, per-recipient state, leases, retry with
backoff, deterministic message IDs, pause/resume/abort, audit history, and
opt-in enforcement. When paused, a recipient already leased by a worker may
finish; only new claims stop.

Therefore the Console:

- never performs optimistic lifecycle changes;
- disables duplicate command submission;
- refreshes the campaign list and detail after acknowledgement;
- explains that pause may allow already-processing recipients to finish;
- uses recipient and audit reads as authority instead of toast history;
- loads recipients and audit when their respective drawer tabs are opened, and
  successful commands invalidate both reads for their next use;
- applies the shared rate-limit behavior without retrying commands
  automatically;
- polls authoritative campaign reads at the bounded shared campaign interval;
- displays backend pause, retry, status-reason, and attention fields without
  duplicating backend thresholds.

## Integrated UI

The `/campaigns` route is the campaign list and monitoring surface.
`/campaigns/new` is a Group List-targeted creation flow. A campaign drawer owns
lifecycle commands, recipient pagination, and audit history. The route and all
filters/cursors remain deep-linkable.

Campaign creation uses the full-width Console layout: content and target panels
stack on narrower viewports. The target selector searches server-owned Group
Lists, records the reviewed version, previews a bounded first page of groups,
and, when `group_list_eligibility` is advertised, reads an on-demand aggregate
for that exact version. The create action stays disabled while any target is
unavailable or unknown. This check is advisory; the atomic create command and
worker revalidation remain authoritative. Servers without the additive
capability retain submit-time validation with an explicit compatibility notice. All fields
and the sole Cancel action are disabled while creation is pending.

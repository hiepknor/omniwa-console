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

## Creation and consent

Each recipient requires explicit opt-in evidence:

```json
{
  "name": "July campaign",
  "text": "Message content",
  "recipients": [
    {
      "jid": "84901234567@s.whatsapp.net",
      "optInSource": "checkout",
      "optInEvidenceReference": "consent-record-id",
      "optedInAt": "2026-07-22T08:00:00Z"
    }
  ]
}
```

The backend hashes the evidence reference before persistence and never echoes
it. The Console does not cache or display the original reference after submit.

## State machines

Campaign status:

- `draft`
- `scheduled`
- `running`
- `paused`
- `completed`
- `aborted`
- `failed`

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

## Worker guarantees and UI implications

The backend provides a durable queue, per-recipient state, leases, retry with
backoff, deterministic message IDs, pause/resume/abort, audit history, and
opt-in enforcement. When paused, a recipient already leased by a worker may
finish; only new claims stop.

Therefore the Console:

- never performs optimistic lifecycle changes;
- disables duplicate command submission;
- refreshes campaign detail, recipients, and audit after acknowledgement;
- explains that pause may allow already-processing recipients to finish;
- uses recipient and audit reads as authority instead of toast history;
- applies the shared rate-limit behavior without retrying commands
  automatically.

## Planned UI

The `/messages` route becomes the campaign list and monitoring surface.
`/messages/new` becomes a consent-aware creation flow. A campaign drawer owns
lifecycle commands, recipient pagination, and audit history. The route and all
filters/cursors remain deep-linkable.

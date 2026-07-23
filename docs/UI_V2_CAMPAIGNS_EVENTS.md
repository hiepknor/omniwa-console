# UI v2 Campaigns and Events

Status: implemented behind `VITE_CONSOLE_UI_GENERATION=v2`.

This slice replaces the legacy instance-picker panels with two contract-owned,
instance-session surfaces. It does not import or visually wrap legacy feature
components.

## Campaigns

Routes:

```text
/messages
/messages/new
/messages/:campaignId
```

The feature requires an instance credential and `campaign_orchestration`. It
owns the complete operation set recorded in `docs/PANELS.md`. List status,
list cursor, detail tab, recipient cursor, and audit cursor are URL-backed and
all cursors remain opaque.

Creation requires explicit JID, opt-in source, evidence reference, and opt-in
time for every recipient. Evidence references exist only in the form state
until submit and the field is cleared after acknowledgement. The Console never
stores them in browser storage, URLs, query keys, acknowledgement copy, or
rendered campaign detail.

Lifecycle commands follow server state. They disable duplicate submission,
perform no optimistic transition, expose normalized conflicts and rate limits,
and invalidate only campaign list/detail/recipient/audit projections after
acknowledgement. Pause explains that an already-leased recipient may finish.
Abort is an explicit terminal confirmation. No command acknowledgement implies
recipient delivery, read state, or campaign completion, and uncertain commands
have no one-click retry.

## Events

Route: `/events`.

The feature requires an instance credential and `events_projection`, and owns
only `GET /events?type=&limit=&cursor=`. Exact type, opaque cursor, and selected
event are URL-backed. An `invalid_cursor` response resets to the first page
without repeating the bad cursor.

The UI labels polling, backend retention, and the no-backfill guarantee. It
renders only normalized safe summaries returned by the API. It never opens the
admin-key WebSocket and never treats toast history as durable history.

## Responsive and accessibility contract

- Tables collapse to labelled record rows at phone width without horizontal
  page overflow.
- Campaign and event inspectors are modal, keyboard-contained, Escape-closeable,
  and restore focus through the shared v2 inspector primitive.
- Filters and pagination remain reachable at 360, 768, 1024, and 1440 pixels.
- Loading, empty, stale refresh, capability/session blocked, rate limited,
  normalized error, acknowledged, pending, and uncertain command semantics use
  the shared v2 state model.

## Verification

- Check that neither feature imports another feature or performs `fetch`.
- Check Campaigns never calls `/instance/all` and never performs recipient
  execution, browser pacing, automatic command retry, or optimistic lifecycle
  changes.
- Check Events calls no operation except `GET /events` and opens no live socket.
- Check recipient `sent`, `delivered`, and `read` remain visibly distinct.
- Check URL/storage/DOM/log output never contains an opt-in evidence reference
  after successful draft creation.

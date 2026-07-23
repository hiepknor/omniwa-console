# UI v2 Platform and Recovery

This vertical slice replaces the complete `/overview` journey in the v2
generation and adds `/recovery` as a capability-gated admin workflow. Legacy
Production remains unchanged.

## Platform Overview

The v2 route reads only its assigned persisted operations:

- `GET /server/overview?window=` for scoped counters;
- `GET /server/health` for independent API, connection, projection, and
  throttling dimensions;
- `GET /server/projection-health` for aggregate and per-resource posture.

The metric window is URL-backed and limited to `1h`, `24h`, `168h`, or the
contract maximum `720h`. Missing counters render as unreported, never zero.
Each read keeps its own loading, initial failure, stale-refresh failure, and
retry behavior. Existing data remains visible after a background refresh
failure. Rate-limited reads are not retried automatically or by an immediate
retry affordance.

Connection status never stands in for projection readiness or throttling.
Projection rows preserve instance identity, pending and dead-letter counts,
event lag, and the server's explicit sync state.

## Projection Recovery

The route owns:

```text
GET  /server/projection-failures?instanceId=&resource=&limit=&cursor=
POST /server/projection-failures/replay
POST /server/projection-failures/discard
```

Both admin scope and `projection_failure_operations` are required before the
list query is enabled. Direct links with the wrong scope or a missing capability
render a factual blocking state and send no recovery request.

Instance/resource filters, page size, opaque cursor, and selected failure live
in URL search params. Filters are applied explicitly rather than issuing a
request on every keystroke. Cursor values are never decoded or constructed.

Replay and discard require a typed operator reason and a confirmation dialog.
Duplicate submission is disabled. Mutations are never automatically retried or
optimistic. A successful response is presented only as server acknowledgement;
the route refreshes the narrow failure-list query and does not claim that the
projection recovered. A transport failure is uncertain and requires the
operator to inspect the refreshed list before another command.

## Verification

- Exercise capability discovery, unsupported, admin, and wrong-scope states.
- Exercise initial loading, empty, ready, stale refresh failure, rate limit, and
  normalized failure output.
- Verify URL filter/cursor reset, direct links, browser back/forward, inspector
  focus, dialog focus restoration, and pending-command close prevention.
- Verify 360, 768, 1024, and 1440 CSS pixels without page-level overflow.
- Confirm acknowledgements never say recovered, successful, delivered, or
  complete beyond the exact server action acknowledgement.

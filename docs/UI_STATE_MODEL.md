# Shared UI State Model

The v2 presentation model keeps independent backend facts independent. A panel
must not collapse capability discovery, projection freshness, resource loading,
transport health and command outcomes into one generic loading/error flag.

## Axes

| Axis | Values | Authority |
| --- | --- | --- |
| Session | disconnected, validating, admin, instance, invalid | Connect probe and active in-memory session |
| Capability | discovering, supported, unsupported, legacy-compatible | `GET /server/capabilities` for the current origin and credential scope |
| Projection | not-started, syncing, ready, stale, failed | Projection response metadata or normalized `projection_not_ready` failure |
| Resource | initial-loading, empty, ready, refreshing, refresh-failed | TanStack Query state plus an authoritative resource result |
| Transport | online, unreachable, rate-limited, authentication-failed | Normalized API transport/failure state |
| Command | idle, pending, acknowledged, uncertain, failed | Mutation lifecycle and synchronous server acknowledgement |

`src/components/v2/state-model.ts` is the typed vocabulary. `StateNotice`
renders its semantic label, title, busy/blocking posture, retained-data posture,
optional product-safe detail and request ID.

## Invariants

- `resource.empty` is valid only after an authoritative ready read.
- `projection.syncing`, `projection.stale`, `resource.refreshing`, and
  `resource.refresh-failed` retain usable prior data.
- `projection.not-started` and `projection.failed` never become empty lists.
- Capability absence never erases a usable stale projection snapshot.
- Rate limiting remains scoped to the affected operation and does not become a
  generic offline state.
- `command.acknowledged` means the API accepted the command boundary; it does
  not mean WhatsApp delivery, campaign completion or projection convergence.
- `command.uncertain` never offers automatic resubmission.
- Authentication failure invalidates the session; ordinary transport failure
  does not.
- Request IDs may be rendered for support, but credentials and raw provider
  payloads may not.

## Composition example

A chat list may simultaneously be:

```text
session.instance
capability.supported
projection.stale
resource.refresh-failed
transport.online
command.idle
```

The list remains visible, the stale/refresh facts are announced, and the UI
does not incorrectly replace rows with a blocking error.

## Feature integration gate

Each v2 route documents which API facts produce each axis value and tests at
least initial loading, authoritative empty, ready, syncing, stale, not-ready,
refresh failure, rate limit and normalized error behavior. Panel-local copies
or alternate state vocabularies fail design review.

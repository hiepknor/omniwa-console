# Feedback and State Presentation

The Console uses one shared feedback system. Features report outcomes and
conditions; centralized components decide whether they appear as a toast,
surface notice, projection notice, or workspace banner.

## Message classes

| Class | Lifetime | Placement | Examples |
| --- | --- | --- | --- |
| Transient acknowledgement | Timed | Toast viewport | API command completed at its HTTP boundary |
| Surface feedback | Until state changes | Form, dialog, drawer, table | Validation, scoped API failure, rate-limit countdown |
| Projection state | Until freshness changes | Owning data surface | Syncing, stale, not started, failed |
| Workspace condition | Until resolved | Below page header | Browser transport outage, invalid session |

Loading, genuinely empty data, stale data, delivery status, campaign status,
and health posture are resource state, not toast notifications.

## Routing policy

| Condition | Renderer |
| --- | --- |
| Server acknowledges a command | Completed/acknowledged toast; never imply WhatsApp delivery |
| Validation failure | Field message beside the invalid control |
| Mutation failure while its surface is open | Surface notice in that form/dialog/drawer |
| Query failure before first snapshot | Error state in the owning panel |
| Refresh failure after a usable snapshot | Keep data visible and show one scoped refresh issue |
| `syncing` | Projection notice; preserve usable data if supplied |
| `stale` | Warning with `lastSyncedAt`; preserve data |
| `not_started`, `failed`, or `projection_not_ready` | Not-ready/failure surface, never an empty list |
| `rate_limited` or `outbound_rate_limited` | Countdown surface; no automatic retry |
| Authentication failure (401) | Clear session and return to Connect |
| Authorization failure (403) | Persistent inline notice; keep session |
| Browser transport failure | One deduplicated workspace banner |
| No public backend surface | Neutral unavailable state |

Background polling failures never create repeated toasts. Starting a refresh
must not replace an existing snapshot with a loading skeleton.

## API errors

`InlineError` renders normalized `ApiFailure` information:

- machine-readable code when present, otherwise category;
- product-safe message;
- request ID only when the backend actually provides one;
- retry action only when safe;
- rate-limit detail and countdown from the shared timer logic.

The current backend does not provide request IDs, so the UI never fabricates an
“unavailable” value. Credentials, stack traces, raw provider payloads, and
reconstructed redacted identities are never feedback content.

## Mutation acknowledgement

Current mutation endpoints complete synchronously at the HTTP boundary. The
toast says what the server acknowledged, not what WhatsApp recipients
experienced. Send delivery/read state and campaign recipient state come from
their projections.

Lifecycle, destructive, invite-link reset, send, and campaign mutations:

- disable duplicate submission while pending;
- are not automatically retried;
- are not optimistically presented as complete;
- refresh authoritative projection state after acknowledgement.

## Toast behavior

- Acknowledged completion: 4 seconds. Neutral information: 6 seconds.
- Error and actionable warning toasts do not auto-dismiss.
- At most three toasts are visible; `dedupeKey` replaces an existing toast.
- Hover, keyboard focus, and a hidden document pause timers.
- Toasts survive route navigation but not page reload.
- Toasts never take focus and always provide dismissal.

## Accessibility

User-triggered errors may use assertive alerts. Informational, synchronization,
and background state use polite status semantics. Polling must not repeatedly
announce the same condition. Color is always paired with text and status icons
are decorative when the same state is written nearby.

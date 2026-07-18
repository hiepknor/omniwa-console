# Feedback and Notification Contract

OmniWA Console uses one feedback model with three renderers. Features report
an outcome or condition; centralized policy decides whether it becomes a
toast, a surface notice, or a workspace banner.

## Message classes

| Class | Lifetime | Placement | Examples |
| --- | --- | --- | --- |
| Transient feedback | Timed | Toast viewport | Command accepted, confirmed completion |
| Surface feedback | Until the surface changes | Form, dialog, drawer, or table | Validation and scoped API failures |
| Workspace condition | Until the condition resolves | Below the page header | Transport outage, invalid session |

Operational resource status, loading, empty, unavailable, and stale data are
surface state. They are not notifications and must not create toasts.

## Routing policy

| Condition | Renderer |
| --- | --- |
| Async command accepted | `accepted` toast; never call it completed or successful |
| Contract-confirmed completion | `completed` toast |
| Validation failure | Field message next to the invalid control |
| Command failure while its dialog or drawer remains open | Surface notice |
| Command failure after its originating surface closes | Persistent error toast |
| Query/list failure | Surface notice inside the owning panel |
| Authentication failure | Clear the session and show a Connect notice |
| Authorization failure | Persistent surface notice; keep the session |
| Browser transport failure | One deduplicated workspace banner |
| `readStatus: unavailable` | Neutral unavailable state, never an error notification |

Overview suppresses the transport banner because Platform posture is the
canonical workspace-status surface on that route. Showing both would duplicate
the same condition and compete for attention.

Background polling failures never create toasts. A new failure may announce
once, but repeated polling must update existing surface or connection state.

## API errors

API feedback renders the product-safe category and message from `ApiFailure`.
It always reserves a request-ID row, using `Request ID unavailable` when the
client has no envelope. Retry is shown only when `retryable` is true.

Request IDs are monospaced, truncate locally on dense layouts, wrap on phone
layouts, and include a copy affordance. Feedback content must never log or
render credentials, raw provider payloads, or reconstructed identifiers.

## Toast behavior

- Accepted: 6 seconds. Completed: 4 seconds. Neutral information: 6 seconds.
- Error and actionable warning toasts do not auto-dismiss.
- At most three toasts are visible. `dedupeKey` replaces an existing toast.
- Hover, keyboard focus, and a hidden document pause the timer.
- Toasts survive route navigation but do not persist across page reloads.
- Desktop/tablet: bottom-right. Phone: above bottom navigation and safe area.
- Toasts never take focus. Every toast has an explicit dismiss control.

The browser does not keep notification history. Durable operational history
belongs to the Events and Audit APIs, not to a client-side toast archive.

## Accessibility

Accepted, completed, and informational feedback use polite status semantics.
A new user-triggered error may use assertive alert semantics. Background query
errors must not be re-announced on every poll. Status always uses a dot plus a
text label; color alone never communicates meaning.

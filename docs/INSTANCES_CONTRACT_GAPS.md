# Instances Panel — Platform Contract Gaps

Status: **proposal**. This document records public-contract limits found while
implementing the M2 Instances panel. The console renders only contract data and
does not reconstruct provider or session material in the browser.

## 1. QR refresh does not return QR material

**Evidence:** `refreshInstanceQr` returns the generic asynchronous
`SuccessEnvelope`. Its `OperationData` can report acceptance and a result
reference, but no public resource schema contains QR content, an image, or an
expiry timestamp. `getInstance` exposes only instance identity, status, display
name, and timestamps.

**Observed local runtime behavior (2026-07-17):** The route returned
`application_handler_not_implemented` with category `infrastructure` and
`retryable: false`. Even after the handler is wired, the documented success
envelope still has no QR presentation resource.

**Console behavior:** The pairing section can request a QR refresh and then
poll instance status when accepted, but it renders an explicit unavailable
state instead of inventing a QR code or reading provider-native material. A
current local runtime displays the product-safe handler error in place.

**Proposed contract change:** Expose a short-lived, authenticated pairing
presentation resource with display-safe QR content and an expiry timestamp, or
provide a dedicated read operation referenced by the accepted refresh command.

## 2. Lifecycle command handlers are incomplete in the local runtime

**Contract evidence:** `requestInstanceReconnect` and
`refreshProviderCapabilities` are documented as partial routes. Their OpenAPI
responses contain authorization failures and HTTP 501 only; no accepted or
success response exists.

**Observed local runtime behavior (2026-07-17):** A disposable instance could
be created and destroyed successfully. `updateInstance`, `connectInstance`,
`disconnectInstance`, and `refreshInstanceQr` returned
`application_handler_not_implemented` with category `infrastructure` and
`retryable: false`. `requestInstanceReconnect` returned the documented
`reconnect_public_route_not_available` error. The local API key did not carry
the provider capability scope, so the provider read correctly returned an
`authorization` error.

**Console behavior:** The actions are present because the Instances panel owns
the operation IDs, but current runtimes surface the product-safe
`not_implemented` error envelope.

**Proposed contract change:** Complete the lifecycle and scheduler-owned
command handlers and return the standard asynchronous acceptance envelope.

## 3. Instance list projections are intentionally sparse

**Evidence:** `InstanceResource` has only `id`, `status`, `displayName`,
`createdAt`, and `updatedAt`. It has no provider identity, webhook count,
message metric, or last-activity timestamp. `ProviderResource` carries at most
one optional `capability` string rather than a capability collection.

**Console behavior:** Missing table and detail values render as `—`. The panel
does not relabel `updatedAt` as message activity and renders only capabilities
explicitly returned by the provider projection.

**Proposed contract change:** Add explicit instance summary fields required by
the operations surface, and return capabilities as a typed collection.

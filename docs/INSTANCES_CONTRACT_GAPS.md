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

**Console behavior:** The pairing section can request a QR refresh and then
poll instance status, but it renders an explicit unavailable state instead of
inventing a QR code or reading provider-native material.

**Proposed contract change:** Expose a short-lived, authenticated pairing
presentation resource with display-safe QR content and an expiry timestamp, or
provide a dedicated read operation referenced by the accepted refresh command.

## 2. Reconnect and capability refresh have no success response

**Evidence:** `requestInstanceReconnect` and
`refreshProviderCapabilities` are documented as partial routes. Their OpenAPI
responses contain authorization failures and HTTP 501 only; no accepted or
success response exists.

**Console behavior:** The actions are present because the Instances panel owns
the operation IDs, but current runtimes surface the product-safe
`not_implemented` error envelope.

**Proposed contract change:** Complete the scheduler-owned command handlers and
return the standard asynchronous acceptance envelope.

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

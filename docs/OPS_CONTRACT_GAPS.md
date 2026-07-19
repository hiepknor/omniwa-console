# Operations Panels — Platform Contract Gaps

Status: **proposal**. This document records public-contract limits found while
implementing the M5 Queue, Webhooks, and Events panels. The console stays within
the public projections and applies best-effort presentation only to pages already
loaded in the browser.

## 1. Operations list reads have no server-side filters

**What the contract provides:** `listJobs`, `listWebhooks`,
`listWebhookDeliveries`, `listEvents`, and `listAuditRecords` accept cursor and
limit parameters, with sort available on the operations that declare it. None
accept status or search filters, and webhook deliveries have no webhook filter.

**What the console needs:** Status and search filters should apply to the full
result set while preserving opaque cursor semantics. Delivery reads also need an
authoritative webhook scope.

**How the console degrades today:** Status, search, and webhook ID filtering run
client-side over loaded pages. Matches on unloaded pages remain absent until the
operator pages through the collection.

**Proposed platform change:** Add documented status and normalized search
parameters to the relevant list operations, plus `webhookId` on delivery reads,
and return cursors scoped to the accepted filter set.

## 2. Webhook deliveries cannot be scoped to one webhook

**What the contract provides:** `listWebhookDeliveries` exposes a global cursor
and limit only; it cannot filter by `webhookId`.

**What the console needs:** A webhook drawer needs cursor pagination over the
complete delivery history for that webhook.

**How the console degrades today:** The drawer filters the loaded global
delivery stream client-side. Reaching a webhook's full delivery history requires
paging the entire delivery collection.

**Proposed platform change:** Add a `webhookId` filter to
`listWebhookDeliveries`, with an opaque cursor scoped to that webhook.

## 3. Queue status uses a generic metrics projection

**What the contract provides:** `getQueueStatus` returns the generic
`MetricsResource`. Queue-count fields are declared in that schema, but every
field is optional and the resource is shared with unrelated metrics reads.

**What the console needs:** Queue posture needs a typed projection whose field
presence and meaning are specific to queue status.

**How the console degrades today:** Missing queue values render as not reported.
The console cannot distinguish an absent value from a field that is not
applicable to this generic metrics instance.

**Proposed platform change:** Define a dedicated `QueueStatusResource` with
typed queue posture and count fields, and bind `getQueueStatus` directly to it.

## 4. Webhook projections omit the endpoint URL

**What the contract provides:** `WebhookResource` exposes identity, lifecycle
status, subscribed event types, and timestamps, but no endpoint URL.

**What the console needs:** Operators need to verify where a registered webhook
delivers before changing its lifecycle or investigating failures.

**How the console degrades today:** The target URL is accepted during
registration and is never readable afterward, so the list and drawer cannot show
the delivery destination.

**Proposed platform change:** Add a display-safe endpoint URL to
`WebhookResource`, with any secret-bearing components explicitly redacted by the
platform.

## 5. Webhook delivery history has no documented projection shape

**What the contract provides:** Webhook delivery history returns generic
`PublicData`, as message delivery history does. The contract defines no typed
attempt, status, timestamp, response, or failure-detail shape for the history.

**What the console needs:** Delivery investigation needs an ordered, typed list
of attempts with display-safe outcomes and timestamps.

**How the console degrades today:** The console inspects the generic response
defensively and renders only recognizable step-like values. Unknown shapes
receive a calm fallback instead of inferred history.

**Proposed platform change:** Define a typed
`WebhookDeliveryHistoryResource` and bind it directly to the operation's success
envelope.

## 6. Event projections have no payload or summary

**What the contract provides:** `EventResource` exposes normalized identity,
type, source, resource reference, correlation ID, and timestamp. It carries no
payload or display-safe summary.

**What the console needs:** Event inspection needs enough display-safe context
to explain what changed without exposing provider-native payloads.

**How the console degrades today:** The inspector shows normalized envelope
facts only and explicitly states that payload contents are outside the public
projection.

**Proposed platform change:** Add an explicitly display-safe event summary or a
typed, redacted detail projection suitable for operator inspection.

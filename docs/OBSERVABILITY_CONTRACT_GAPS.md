# Overview Observability — Platform Contract Gaps

Status: **proposal**. This document is input for the OmniWA platform contract,
not console implementation work. It records gaps found while implementing the
M1 Overview panel against the live platform.

## Context

The Overview panel can render only what the public REST contract states. The
current projections expose useful point-in-time resources, but several UX
contexts in the validated prototype would require the console to infer or
invent meaning. The contract should carry that meaning instead.

## 1. Collection pagination has no total count

**Evidence:** `CollectionEnvelope.meta.pagination` exposes only cursor and
limit (`../omniwa/apps/api/src/http-server.ts`). The Overview “Action required
· N” header and “X of Y items” footer therefore degrade to the fetched-page
length.

**Proposed contract change:** Add an optional `total` or `totalEstimate` field
to pagination metadata.

## 2. Metrics resources carry no window or rate semantics

**Evidence:** `MetricsResource` is a generic bag of `value`, `count`, and
`*JobCount` fields (`../omniwa/docs/api/openapi/omniwa-v1.openapi.json`). It has
no time window such as 24h, delivered percentage, webhook success rate, or
trend field. The console can honestly render only value-only cards.

**Proposed contract change:** Introduce windowed metric variants or explicit
rate, window, and trend fields.

## 3. Action-required items are underspecified

**Evidence:** Items uniformly receive `resourceType: "health"` from
`resourceTypeForQuery` in `../omniwa/apps/api/src/http-server.ts`. They have no
display name, while the subject is only a free-form `subjectRef`; the console
must parse prefixes such as `instance:` and `worker-job:` to build deep links.

**Proposed contract change:** Add a typed
`subject { kind, id, label }` to action-required items.

## 4. Empty read projections surface as 503

**Evidence:** The platform distinguishes an unavailable read from a real
failure with a data envelope carrying
`ResourceReadData.readStatus: "unavailable"` and a `reasonCode` under HTTP 503.
The observed reason code was
`application_handler_not_implemented` on `/v1/dashboard`,
`/v1/metrics/messages`, `/v1/metrics/webhooks`, `/v1/metrics/media`, and
`/v1/action-required`. The console now parses this shape and renders it as an
empty state rather than an outage.

**Proposed contract change:** Consider returning HTTP 200 for unavailable
reads, because HTTP 503 causes generic clients and uptime monitors to report
an outage. Explicitly document the `readStatus` and `reasonCode` semantics in
the OpenAPI schema descriptions.

## 5. Readiness fails closed permanently in local development

**Evidence:** `/v1/health/readiness` returns 503 because the default composition
does not wire a `runtimeReadinessEvaluator`. This is known platform issue
ISSUE-0015, documented in `../omniwa/docs/IMPLEMENTATION_STATUS.md`.

**Proposed contract change:** Complete ISSUE-0015 by wiring a real readiness
evaluator in the default composition. Until then, the console health strip
will show “Readiness unreachable.”

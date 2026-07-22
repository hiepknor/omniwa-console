# API Client Boundary

All HTTP access lives in `src/api/`. Features consume typed API functions and
TanStack Query hooks; components never construct URLs, headers, envelopes, or
credential scopes.

## Generation pipeline

```text
../omniwa-go/docs/swagger.json
        │  pnpm contract:sync (Swagger 2 → OpenAPI 3)
        ▼
contracts/omniwa-go.openapi.json
        │  pnpm api:generate
        ▼
src/api/generated/schema.d.ts
        │
        ▼
src/api/client.ts (openapi-fetch)
```

The contract and generated schema are committed so the console builds offline.
Only the orchestrator runs contract sync. Generated files are never edited by
hand. `pnpm contract:check` verifies schema freshness, every typed `METHOD
/path` call against the vendored contract, and feature ownership against
`docs/PANELS.md`.

Swaggo occasionally describes whatsmeow runtime values inaccurately. Any
runtime narrowing required for those endpoints stays quarantined in `src/api/`
with an explanatory comment; features still receive stable console types.

## Client scopes

`createApiClient({ baseUrl, apiKey })` creates a client with exactly one
credential header:

```http
apikey: <global-admin-key-or-instance-token>
```

The authenticated shell provides the session client through `ApiProvider`.
Instance-scoped hooks create a second client from the selected instance token.
Tokens never appear in query keys; the stable instance ID owns cache scope.

## Capability negotiation

`CapabilitiesProvider` queries `GET /server/capabilities` for the active
session. Projection panels call `useInstanceCapabilities(instanceId, token)`
when instance scope changes.

- Preserve unknown capability strings.
- Use each projection capability as an initial-readiness signal for its owning
  feature; response metadata remains authoritative after a usable read.
- Capability absence must not be represented as an empty resource list or hide
  an existing stale snapshot.
- A panel that is not yet integrated remains unavailable even if the backend
  advertises its capability.

## Success envelopes

Most endpoints return:

```json
{ "message": "success", "data": {} }
```

Projection endpoints add freshness and cursor metadata:

```json
{
  "message": "success",
  "data": [],
  "meta": {
    "source": "projection",
    "syncStatus": "ready",
    "lastSyncedAt": "2026-07-22T08:00:00Z",
    "nextCursor": "opaque-value"
  }
}
```

Use:

- `unwrap<T>` for ordinary enveloped or known bare responses;
- `unwrapProjection<T>` when freshness/cursor metadata must be preserved;
- `unwrapCommand` for server-acknowledged mutations.

Known bare-response endpoints must remain explicit. In particular,
`GET /label/list` returns a legacy bare array. The Groups adapters continue to
accept the historical raw list during compatibility rollout, but current
projection responses preserve their success envelope and metadata.

## Projection state

`ProjectionResult<T>` contains `{ resource, meta }`. Consumers distinguish:

- `ready`: authoritative, including an empty result;
- `syncing`: synchronization in progress, possibly with usable data;
- `stale`: usable stored data with a freshness warning;
- `not_started` or `failed`: not an empty result;
- HTTP 503 `projection_not_ready`: render a not-ready surface and never call a
  live WhatsApp endpoint as fallback.

Use the shared `ProjectionNotice` rather than panel-specific state copy.

## Errors

Runtime errors are normalized to `ApiFailure` with:

- product-safe `message`;
- machine-readable `code` when supplied;
- inferred `category`;
- HTTP status;
- retryability;
- `retryAfterSeconds` and absolute `retryAt` for rate limits;
- optional request ID for forward compatibility (current OmniWA GO responses do
  not provide one).

The adapter recognizes the codes documented in
`docs/OMNIWA_GO_CONTRACT.md`. It reads `Retry-After` before the body fallback and
never automatically retries `rate_limited`, `outbound_rate_limited`, or
`projection_not_ready`.

## Pagination and filtering

Projection list cursors are opaque. Pass them back exactly as received.

- Include instance, normalized filters/search, and current cursor in the query
  key.
- Put filter and cursor state in URL search params for deep links.
- Reset the cursor when instance, search, or filter scope changes.
- Never decode, construct, concatenate, or transfer a cursor to another scope.
- On `invalid_cursor`, remove the current cursor and return to the first page;
  never retry the same opaque value in a loop.
- Default `limit` is 50 and maximum is 200 unless the endpoint says otherwise.

Use `useInfiniteQuery` only when the UI intentionally accumulates pages. A
page-at-a-time UI may bind the current opaque cursor directly to the URL.

## Query keys and invalidation

Keys mirror resource and credential scope:

```text
['capabilities', 'session']
['capabilities', 'instance:<instanceId>']
['instances']
['instances', instanceId, 'groups', { search, cursor, limit }]
['instances', instanceId, 'group', groupId]
['instances', instanceId, 'contacts', { search, cursor, limit }]
['instances', instanceId, 'contact', contactId]
['instances', instanceId, 'messages', { cursor }]
['events', { type, cursor, limit }]
```

Mutations wait for server acknowledgement, then invalidate the narrowest keys
that cover changed projections. Do not clear the full cache for a local change.

## Mutation semantics

Current OmniWA GO mutation responses are synchronous at the HTTP boundary. A
completed request does not prove WhatsApp delivery, message read state, or
campaign recipient completion.

- Disable duplicate submission while pending.
- Do not automatically retry mutations.
- Avoid optimistic updates for send, destructive actions, invite-link reset,
  instance/campaign lifecycle, and other authoritative state transitions.
- Refresh the projection after acknowledgement.

## Global query policy

The app disables refetch-on-window-focus to avoid request storms. Queries may
retry once only for retryable transient 5xx failures. Rate limits and permanent
service conditions are never automatically retried. Projection polling must be
bounded and must not reach WhatsApp live.

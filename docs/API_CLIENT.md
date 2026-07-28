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

The contract and generated schema are committed so the Console builds offline.
Only the orchestrator runs contract sync. Generated files are never edited by
hand. `pnpm contract:check` verifies schema freshness, every typed `METHOD
/path` call against the vendored contract, and feature ownership against
`docs/PANELS.md`.

Swaggo occasionally describes whatsmeow runtime values inaccurately. Any
runtime narrowing required for those endpoints stays quarantined in `src/api/`
with an explanatory comment; features still receive stable Console types.

## Client scopes

`createApiClient({ baseUrl, apiKey })` creates a client with exactly one
credential header:

```http
apikey: <global-admin-key-or-instance-token>
```

The authenticated shell provides the session client through `ApiProvider`.
Credential-free metadata owns ordinary instance list/detail reads. A one-time
create or rotation token may populate the in-memory instance credential vault;
instance-scoped hooks create a second client from that vault. The vault is not
browser-persisted. Tokens never appear in query keys; the stable instance ID
owns cache scope.

## Capability negotiation

`CapabilitiesProvider` queries `GET /server/capabilities` for the active
session. Projection panels call `useInstanceCapabilities(instanceId, token)`
when instance scope changes.

- The connect adapter uses the authenticated `credentialScope` response field
  directly as its primary and single scope-discovery request. `instanceId` is
  retained only for explicit instance scope.
- It does not infer credential scope from capabilities, projection readiness,
  key syntax, or HTTP failures. A 401 is an authentication failure.
- Only a successful response from an older revision with no `credentialScope`
  enables the sequential compatibility probes (`/instance/all`, then
  `/instance/status` when the admin endpoint returns 403). The probes never run
  concurrently.
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
`GET /label/list` returns a historical bare array, so readiness comes from the
instance `labels_projection` capability and not from response metadata. The
Groups adapters continue to accept the historical raw list during compatibility
rollout, but current projection responses preserve their success envelope and
metadata.

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
- optional request ID, preferring the exposed `X-Request-ID` response header and
  falling back to a body `requestId` when present;
- local credential scope (`session` or `instance`) so an invalid attached
  instance token cannot invalidate an otherwise valid admin session. This scope
  is browser-only metadata and is never sent over the network.

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
['instances', instanceId, 'groups', { search, type, myRole, sendMode, state, membershipState, cursor, limit, normalized }]
['instances', instanceId, 'groups', 'summary']
['instances', instanceId, 'group', groupId, 'members', { search, role, cursor, limit }]
['instances', instanceId, 'group', groupId, 'audit', { cursor, limit }]
['instances', instanceId, 'media-assets', mediaId]
['instances', instanceId, 'media-assets', mediaId, 'content']
['instances', instanceId, 'group', groupId]
['instances', instanceId, 'group-lists', { search, cursor, limit }]
['instances', instanceId, 'group-lists', groupListId]
['instances', instanceId, 'group-lists', groupListId, 'groups', { cursor, limit }]
['instances', instanceId, 'group-lists', groupListId, 'audit', { cursor, limit }]
['instances', instanceId, 'group-list-eligibility', { groupJids }]
['instances', instanceId, 'group-lists', groupListId, 'eligibility', { expectedVersion }]
['instances', instanceId, 'contacts', { search, cursor, limit }]
['instances', instanceId, 'contact', contactId]
['instances', instanceId, 'labels']
['instances', instanceId, 'label', labelId]
['instances', instanceId, 'chats', {}] # infinite-query cursors stay in page params
['instances', instanceId, 'chat', chatId]
['instances', instanceId, 'chat', chatId, 'messages', {}]
['instances', instanceId, 'message', messageId]
['instances', instanceId, 'message', messageId, 'delivery-history']
['events', { type, cursor, limit }]
```

Mutations wait for server acknowledgement, then invalidate the narrowest keys
that cover changed projections. Do not clear the full cache for a local change.
List key factories omit the parameter object when called without parameters;
that shorter key is the canonical invalidation prefix. Concrete reads append
their normalized filter/cursor object. Do not manufacture an empty parameter
object in mutation invalidation, because it would miss cached filtered or
paginated variants. The literal `session` scope is the non-secret cache scope
for panels whose active API client already represents one operator session;
credentials never enter a key.

Group List eligibility preflight is a read even though its bounded batch
operation uses `POST`. It is owned by TanStack Query, keyed by the ordered group
JIDs, and never auto-submits a mutation. Whole-list assessment includes the
reviewed version in its key. Structured eligibility rejection details remain
inside `src/api/` until narrowed to the public-safe issue shape.

Resource adapters stay split by backend domain. Chat projection DTOs live in
`src/api/chats.ts`; Message, receipt, and verified send contracts live in
`src/api/messages.ts`. Do not restore the former cross-domain Platform types,
add action stubs, or infer fields such as chat-label associations that OmniWA GO
does not expose.

## Mutation semantics

Current OmniWA GO mutation responses are synchronous at the HTTP boundary. A
completed request does not prove WhatsApp delivery, message read state, or
campaign recipient completion.

Do not offer one-click retry after an uncertain send failure. A transport/5xx
failure can occur after WhatsApp accepted the message, and neither `/send/text`
nor `/send/media` has a Console-owned idempotency contract. Operators must
inspect projected history before submitting again. Rate-limit cooldown handling
remains visible but does not auto-resubmit a send.

Media sends use the JSON URL branch with an explicit supported media type. The
Console does not retain binary uploads or base64 media in component, mutation,
or query state.

Normalized Group Management commands are the idempotent exception to the
older provider mutation model. Generate one `Idempotency-Key` per operator
submission and keep the acknowledgement typed as `completed`,
`partially_completed`, `failed`, or `unknown`. Never auto-retry a management
mutation, including HTTP 429 or `unknown`; the operator reviews the projection
and audit before issuing another command. Participant commands preserve every
ordered outcome. `projectionRefreshExpected` authorizes a narrow invalidation,
but does not claim that the refreshed projection has converged.

Group photo upload uses authenticated multipart `POST /media-assets`, polls
only the returned asset record while it is non-terminal, and applies a `ready`
asset by ID. Blob content is read through `src/api/` so the instance credential
is attached without exposing a storage URL.

The Composer requires both `messages_projection` and `outbound_rate_limit`.
Projection readiness makes the write-through result observable; outbound
capability confirms that message pacing is independent from information-query
limits.

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

Read cadences come from `src/lib/query-policy.ts`: fleet reads poll every 15
seconds, platform and campaign reads every 30 seconds, ordinary persisted
projections every 60 seconds, and QR reads every 20 seconds only while the
pairing surface is active. A disabled route or missing scoped credential must
return `false` from its polling policy rather than leave a background timer.

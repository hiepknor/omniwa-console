# API Client Boundary

All network access lives in `src/api/`. Feature code consumes typed hooks
and helpers; it never calls `fetch` directly against the platform.

## Generation pipeline

```
contracts/omniwa-v1.openapi.json      # vendored copy of the platform contract
        │  pnpm contract:sync         # refresh from ../omniwa/docs/api/openapi/
        ▼
src/api/generated/schema.d.ts         # pnpm api:generate (openapi-typescript)
        ▼
src/api/client.ts                     # openapi-fetch client factory
```

- `contracts/omniwa-v1.openapi.json` is committed so the repo builds without
  the platform repo present. `pnpm contract:sync` copies the latest spec from
  the sibling checkout; commit contract bumps as their own change.
- `src/api/generated/` is never edited by hand.
- `openapi-fetch` keys every call by path + method, which the contract binds
  1:1 to operation IDs — so panel contracts in `docs/PANELS.md` stay
  verifiable against the code.

## Client factory

`createApiClient(session)` returns an `openapi-fetch` client configured with:

- `baseUrl` from the session (default `http://localhost:3000`).
- `x-api-key` header from the session.

The client is created once per session in the app shell and provided through
React context (`useApi()`).

## Envelopes

Every response is one of three envelopes:

| Envelope | Shape | Used by |
| --- | --- | --- |
| `SuccessEnvelope` | `{ data: object, meta }` | Single resource / operation responses |
| `CollectionEnvelope` | `{ data: object[], meta: meta & { pagination } }` | List / history responses |
| `ErrorEnvelope` | `{ error: { code, message, details }, meta }` | All failures |

`meta` always carries `requestId`, `correlationId`, `timestamp`. Error
toasts and detail drawers must show `requestId` so operators can correlate
with platform logs.

`error.details.category` is one of: `authentication`, `authorization`,
`business`, `conflict`, `infrastructure`, `validation`, `not_found`,
`not_implemented`, `internal`. `error.details.retryable` is explicit when
known — offer a retry affordance only when it is `true`.

Helpers in `src/api/envelopes.ts` unwrap these shapes and narrow errors into
a typed `ApiFailure` so features never parse envelopes themselves.

## Pagination

Collections use opaque cursor pagination:

- Request: `cursor`, `limit` (server caps at 200), plus whitelisted `sort`,
  `search`, and `filters`.
- Response: `meta.pagination.nextCursor` / `previousCursor` / `hasMore`,
  plus the *accepted* (server-normalized) sort/search/filters, which the UI
  reflects back into its controls.

Cursors are opaque; never parse or construct them. List panels use TanStack
Query `useInfiniteQuery` with `nextCursor` as the page param.

## Query keys

Convention: `[resource, scope?, params?]`, mirroring the URL hierarchy.

```
['instances']
['instances', instanceId]
['instances', instanceId, 'chats', { cursor, search }]
['messages', messageId, 'delivery-history']
['queue', 'status']
['webhooks', webhookId, 'deliveries', params]
```

Mutations invalidate the narrowest key that covers the affected reads. SSE
invalidation (see `docs/REALTIME.md`) reuses the same keys.

## Command disposition semantics

Public write operations may return either `200 Success` or `202 Accepted`.
The API boundary preserves that distinction as `CommandResult.disposition`:

- `200` becomes `completed`: the platform completed the command boundary.
- `202` becomes `accepted`: work continues asynchronously and must be followed
  through resource reads or SSE invalidation.

Do not infer disposition from `data.accepted` alone. A synchronously completed
command may still carry `accepted: true`; HTTP status is the authoritative
transport distinction. Features consume `unwrapCommand` and never inspect the
raw response.

Command completion is not upstream completion. In particular, a completed
send command does not mean WhatsApp delivery. Message UI continues to render
accepted, queued, delivered, failed, and canceled as separate resource states
and follows delivery history independently.

`pnpm contract:check` verifies generated-schema freshness, operation ownership
in `docs/PANELS.md`, and disposition preservation for consumed operations that
declare both `200` and `202`.

## Auth headers

Exactly one header carries credentials: `x-api-key`. There are no cookies
and no token refresh. A 401/`authentication` failure clears the session and
returns the operator to `/connect`; a 403/`authorization` failure renders in
place (the key lacks scope — reconnecting won't help).

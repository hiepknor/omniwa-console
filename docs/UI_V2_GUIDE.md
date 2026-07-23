# UI v2 implementation guide

This is the canonical implementation and review contract for the v2 Console.
The contract matrix decides which public operations belong in Console,
`PANELS.md` assigns them to routes, and this guide defines how those routes
present state and preserve operator safety. Deployment and cutover gates live
only in [DEPLOYMENT.md](DEPLOYMENT.md).

## Generation and visual foundation

`VITE_CONSOLE_UI_GENERATION=v2` selects the complete v2 route manifest and CSS
entrypoint at build time. Missing, invalid, or differently cased values select
legacy. The switch changes presentation only: both artifacts share the session,
API client, capabilities, query client, and memory-only credential flow.

Canonical presentation sources are:

- `src/styles/tokens.css` for tokens;
- `src/styles/ui-v2.css` for `ui-v2-*` selectors;
- `src/components/v2/` for production primitives;
- `/__ui-v2` for the development-only production-component gallery.

Do not patch v2 in legacy `console.css`, reuse generic legacy selectors, copy
prototype styles, or add panel-specific table/dialog/inspector geometry. Extend
a shared primitive and its gallery state. V2 artifact isolation and the later
legacy removal boundary are defined in `docs/DEPLOYMENT.md`.

## Shared state model

Backend facts remain independent instead of collapsing into one loading/error
flag:

| Axis | Values | Authority |
| --- | --- | --- |
| Session | disconnected, validating, admin, instance, invalid | Connect probe and memory session |
| Capability | discovering, supported, unsupported, legacy-compatible | `GET /server/capabilities` in current scope |
| Projection | not-started, syncing, ready, stale, failed | Projection metadata or normalized failure |
| Resource | initial-loading, empty, ready, refreshing, refresh-failed | TanStack Query plus authoritative result |
| Transport | online, unreachable, rate-limited, authentication-failed | Normalized API failure |
| Command | idle, pending, acknowledged, uncertain, failed | Mutation and server acknowledgement |

`src/components/v2/state-model.ts` owns this vocabulary and `StateNotice`
renders it. The invariants apply to every route:

- empty is valid only after an authoritative ready read;
- syncing, stale, refreshing, and refresh-failed retain usable prior data;
- not-started or failed projection state never becomes an empty collection;
- rate limiting remains operation-scoped and is not generic offline state;
- acknowledgement means only that the server accepted the command boundary;
- uncertain mutations have no automatic or one-click retry;
- authentication failure invalidates the session, ordinary transport failure
  does not;
- request IDs may be rendered, but credentials and raw provider data may not.

Filters, opaque cursors, selection, and panel mode live in URL search params.
Changing a cursor's filter or instance scope resets it. Server reads use the
bounded cadences in `src/lib/query-policy.ts`; mutations never poll, retry
automatically, or update optimistically.

## Shell and Connect

Connect normalizes an HTTP(S) origin with no path, query, fragment, or user
info; probes `GET /instance/all` for admin scope; and only after authorization
rejection probes `GET /instance/status` for instance scope. Duplicate submit is
blocked and the probe aborts after 15 seconds. The key is never stored, added to
a URL/query key, logged, or rendered, and reload/sign-out destroys it.

The Shell always exposes environment, credential scope, capability-discovery
posture, backend revision, and memory-only credential posture. Admin navigation
contains Overview, supported Recovery, and Instances. Instance navigation
contains Overview, Conversations, Groups, Campaigns, and Events. Unsupported
contractless surfaces are absent rather than disabled placeholders.
At compact widths, the secret visibility control remains a labelled pill with
the same shape and wording as desktop; it must not collapse into a circular
icon.

## Platform and Recovery

Overview owns `GET /server/overview`, `GET /server/health`, and
`GET /server/projection-health`. The URL window is one of `1h`, `24h`, `168h`,
or `720h`. Missing counters stay unreported. API, instance connection,
projection, and throttling facts remain independent, and stale data survives a
refresh failure.

Recovery requires admin scope plus `projection_failure_operations` and owns:

```text
GET  /server/projection-failures?instanceId=&resource=&limit=&cursor=
POST /server/projection-failures/replay
POST /server/projection-failures/discard
```

Filters, cursor, and selected failure are URL-backed. Replay/discard require a
typed reason of at least eight characters and confirmation, prevent duplicate
submission, refresh the narrow failure list, and report acknowledgement without
claiming recovery.

## Instances

The admin fleet requires `instance_metadata_views` and uses only
`GET /instance/metadata` and `GET /instance/metadata/{instanceId}`. It never
falls back to credential-bearing `/instance/all` or `/instance/info`. Credential
Health additionally requires `instance_credential_health`, treats 0/0 as
non-representative, and never derives `safeToRemove`.

Instance tokens attach only inside the selected workspace or arrive once from
create/rotation. They stay in the in-memory vault and never enter metadata,
query keys, URLs, browser storage, logs, analytics, or diagnostics. The token
scopes status, QR, connect/disconnect/reconnect/logout, and advanced settings.
QR is read only while connected and not logged in; pairing is complete only
when refreshed status reports `loggedIn`.

Create, rotate, and delete are admin commands. One-time tokens require an
explicit stored acknowledgement. Rotation requires current version and reason;
destructive commands require exact instance ID. No acknowledgement is presented
as final connectivity, pairing, settings, or deletion state.

## Conversations

Conversations requires an instance credential and independently gates chats,
messages, contacts, and labels with their projection capabilities. It uses the
session scope directly, never calls `/instance/all`, and never falls back to a
live WhatsApp read. Routes `/chats` and `/chats/:chatId` keep view, search,
cursors, directory selection, and message selection in the URL.

Projected chat/message details, receipts, contacts, and labels remain
authoritative. Message detail must belong to the selected chat; unknown fields
remain unreported; label associations are not reconstructed when absent from
the public DTO.

Text and remote-URL media sends additionally require `outbound_rate_limit`.
Binary/base64 media never enters browser state. Pending sends cannot duplicate,
and acknowledgement never means WhatsApp delivery; projected status and
per-recipient receipts remain authoritative.

## Groups

Groups requires instance scope and `groups_projection`; admin or unsupported
routes send no request. `/groups` and `/groups/:groupId` keep applied search,
cursor, create state, and selection in the URL. Search is explicit, resets the
cursor, and never falls back to live group lookup.

Approved create, metadata, setting, membership, invite, leave, and group-text
commands match `PANELS.md`. Multi-command metadata failure is presented as
potentially partial. Destructive/member/invite actions require exact typed
confirmation. Acknowledgement refreshes the narrow group projection and never
claims provider completion or message delivery.

## Campaigns and Events

Campaign routes `/messages`, `/messages/new`, and `/messages/:campaignId`
require instance scope and `campaign_orchestration`. List/detail/recipient/audit
cursors are opaque and URL-backed. Every recipient requires opt-in source,
evidence reference, and time. Evidence exists only until draft acknowledgement
and never enters storage, URLs, query keys, acknowledgement copy, or detail.

Lifecycle commands follow server state, prevent duplicate/optimistic changes,
and invalidate only campaign projections. Pause explains leased work; abort is
an explicit terminal confirmation. Acknowledgement never means delivery, read,
or campaign completion.

Events requires instance scope and `events_projection`, owns only
`GET /events`, and keeps type, cursor, and selection in the URL. Invalid cursors
reset to the first page. The route labels retention and no historical backfill,
renders only normalized safe summaries, and never opens the admin-key WebSocket.

## Shared verification contract

For every route, verify:

- correct and blocked credential scopes send only the owned operations;
- capability discovering, supported, unsupported, and applicable compatibility
  behavior;
- initial loading, authoritative empty, ready, syncing, stale/not-ready,
  refresh failure, normalized error/request ID, and rate limit;
- direct links, reload, browser back/forward, filter/cursor reset, and opaque
  cursor handling;
- duplicate-submit prevention, pending close prevention, acknowledgement copy,
  uncertainty, and narrow invalidation;
- keyboard order, visible focus, focus restoration, status text, and no
  page-level overflow at 360, 768, 1024, and 1440 CSS pixels;
- 44px minimum compact touch targets and reduced-motion suppression of
  non-essential transitions;
- no credential, one-time token, opt-in evidence, or raw provider payload in
  storage, URL, query keys, logs, analytics, diagnostics, or rendered errors.

`pnpm design:check`, `pnpm credential:check`, generation artifact checks, route
tests, and the production gallery enforce the automatable subset. Operational
evidence and promotion remain governed by `docs/DEPLOYMENT.md`.

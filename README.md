# omniwa-console

`omniwa-console` is a standalone React + Vite operations console for the public
OmniWA GO REST API. It is a client-only SPA: it contains no backend, database,
WhatsApp provider integration, campaign worker, or domain orchestration.

The console is being migrated panel by panel onto OmniWA GO's persisted
projections and operational APIs. Implemented surfaces remain usable while
pending and unsupported surfaces render explicit states instead of simulated
data.

## Product role

The console serves self-hosted operators who need visual instance management,
QR pairing, group administration, conversation and event inspection, health
posture, and campaign monitoring.

It is not:

- a WhatsApp Web clone or consumer chat client;
- a backend or direct database administration tool;
- a place to implement pacing, retries, consent, or campaign execution;
- a holder for the global admin key in build-time configuration;
- an adapter for private OmniWA GO packages.

## Technical boundaries

- React 18, Vite, strict TypeScript, React Router, TanStack Query, and Tailwind.
- All network access is implemented in `src/api/` with `openapi-fetch`.
- The contract is vendored at `contracts/omniwa-go.openapi.json` and generated
  types live in `src/api/generated/schema.d.ts`.
- Authentication uses the runtime `apikey` header: either a global admin key or
  a per-instance token.
- Server state belongs to TanStack Query; filters, cursors, and selection state
  that define operator context belong in the URL.
- The SPA does not open OmniWA GO's admin-key WebSocket. Durable history comes
  from `/events`; ordinary panels use safe REST reads and bounded polling until
  a browser-safe realtime bridge exists.

## Backend capabilities

The current backend exposes capability negotiation, projection-backed Groups,
Contacts, Labels, Chats, Messages, durable Events, Overview/Health, split
information/outbound rate limiting, and campaign orchestration. The console
must gate integrations with `GET /server/capabilities` and preserve projection
freshness metadata.

See [docs/OMNIWA_GO_CONTRACT.md](docs/OMNIWA_GO_CONTRACT.md) for the handoff and
cross-cutting contract semantics.

## Documentation

- [Immutable deployment](./docs/DEPLOYMENT.md)

| Document | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Mandatory repository rules for coding agents |
| [docs/DELIVERY_WORKFLOW.md](docs/DELIVERY_WORKFLOW.md) | Required delivery lifecycle from intake through merge |
| [docs/OMNIWA_GO_CONTRACT.md](docs/OMNIWA_GO_CONTRACT.md) | Backend handoff, capabilities, projections, errors, and health semantics |
| [docs/CONTRACT_UI_MATRIX.md](docs/CONTRACT_UI_MATRIX.md) | Reviewed UI disposition for every public contract operation |
| [docs/CONTRACT_BACKLOG.md](docs/CONTRACT_BACKLOG.md) | Deferred/external decision units, accountable roles, and exit criteria |
| [docs/REDESIGN_BRIEF.md](docs/REDESIGN_BRIEF.md) | Contract-first UI redesign architecture, migration order, and cutover gates |
| [docs/UI_V2_FOUNDATION.md](docs/UI_V2_FOUNDATION.md) | Canonical tokens, cascade isolation, production primitives, and gallery review |
| [docs/UI_STATE_MODEL.md](docs/UI_STATE_MODEL.md) | Shared session, capability, projection, resource, transport, and command states |
| [docs/UI_V2_SHELL_CONNECT.md](docs/UI_V2_SHELL_CONNECT.md) | Generation-gated Shell and Connect behavior, navigation scope, and review checklist |
| [docs/UI_V2_PLATFORM_RECOVERY.md](docs/UI_V2_PLATFORM_RECOVERY.md) | Persisted Platform Overview and audited projection-recovery workflow |
| [docs/UI_V2_INSTANCES.md](docs/UI_V2_INSTANCES.md) | Metadata-only fleet management, live instance workspace, and credential lifecycle |
| [docs/UI_V2_CONVERSATIONS.md](docs/UI_V2_CONVERSATIONS.md) | Instance-scoped projection workspace for chats, messages, directories, and bounded sends |
| [docs/UI_V2_GROUPS.md](docs/UI_V2_GROUPS.md) | Projection-backed group directory, membership, settings, invite, and command workflow |
| [docs/UI_V2_CAMPAIGNS_EVENTS.md](docs/UI_V2_CAMPAIGNS_EVENTS.md) | Consent-aware campaign orchestration and durable normalized event history |
| [docs/UI_V2_CUTOVER_READINESS.md](docs/UI_V2_CUTOVER_READINESS.md) | Generation-isolated artifacts, rollback boundary, and remaining Production gates |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | SPA layers, state ownership, and safety boundaries |
| [docs/API_CLIENT.md](docs/API_CLIENT.md) | Generated client, envelopes, errors, cursors, and query keys |
| [docs/AUTH_AND_SESSION.md](docs/AUTH_AND_SESSION.md) | Runtime key entry, scope, and storage |
| [docs/PANELS.md](docs/PANELS.md) | Panel ownership and integration status by `METHOD /path` |
| [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) | Ordered OmniWA GO integration phases |
| [docs/FEEDBACK.md](docs/FEEDBACK.md) | Feedback and projection-state presentation |
| [docs/REALTIME.md](docs/REALTIME.md) | Browser realtime posture and durable event recovery |
| [docs/RATE_LIMIT.md](docs/RATE_LIMIT.md) | Information and outbound rate-limit behavior |
| [docs/CAMPAIGNS.md](docs/CAMPAIGNS.md) | Campaign contract and planned UI |
| [docs/UNSUPPORTED_SURFACES.md](docs/UNSUPPORTED_SURFACES.md) | Routes with no public OmniWA GO management API |

## Development

Dependencies are pre-installed in the agent environment. Do not fetch packages
from an implementation sandbox.

```bash
pnpm dev
pnpm test
pnpm check
```

The default API origin is `http://localhost:4000`. The operator enters the
origin and key on `/connect`; credentials are never compiled into the bundle.

Contract refresh is an orchestrator action and requires the sibling
`../omniwa-go` checkout:

```bash
pnpm contract:sync
pnpm api:generate
```

Commit the vendored contract and generated schema together. Never edit generated
files manually.

## Required delivery workflow

Every file-changing task uses a fresh branch and pull request from the latest
`origin/main`. Before handoff, run:

```bash
git diff --check
pnpm test
pnpm check
```

Do not merge without explicit user authorization. Full rules are in
`docs/DELIVERY_WORKFLOW.md`.

## License

UNLICENSED (private, pre-release).

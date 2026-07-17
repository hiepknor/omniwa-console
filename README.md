# omniwa-console

`omniwa-console` is a standalone web operations console for OmniWA Platform.

This repository implements an external browser client for OmniWA Platform.
It does not contain OmniWA backend logic.

## What It Is

`omniwa-console` is a browser-based operations console for working with OmniWA
resources. It is the web counterpart of `omniwa-tui`: where the TUI serves
SSH-first operators, the console serves operators who want visual density,
mouse-friendly navigation, QR pairing on screen, and shareable deep links.

Core properties:

- React + Vite single-page application, TypeScript throughout.
- API-client-only; all platform state comes from OmniWA public REST APIs.
- Contract-driven: request/response types are generated from the published
  OpenAPI v1 specification. No hand-written DTOs.
- Realtime-aware, with SSE (`streamEvents`) preferred when available.
- Full resource console: instances, messages, chats, contacts, labels,
  groups, queue/jobs, webhooks, events, settings.
- Operator tool, not an end-user chat product.

## Repository Scope

This repository owns:

- Browser UX and SPA application shell.
- Panel contracts for OmniWA resources (see `docs/PANELS.md`).
- Generated TypeScript API client boundary (see `docs/API_CLIENT.md`).
- Local API key entry and session storage (see `docs/AUTH_AND_SESSION.md`).
- SSE ingestion and normalization for browser presentation.
- Static build packaging for deployment behind any web server.

This repository does not own:

- OmniWA backend domain logic.
- Backend command/query handlers.
- Database migrations or schemas.
- Terminal UI (`omniwa-tui`), CLI, or MCP server code.
- Internal service orchestration.

## Non-Goals

`omniwa-console` is not:

- A WhatsApp Web clone or end-user messenger.
- A CRM or campaign/broadcast tool.
- A backend admin panel with direct database access.
- A mobile app.
- A multi-tenant SaaS control plane (MVP model is Single Tenant + Multi Instance).

## Platform Client Guardrails (inherited from OmniWA Phase J)

- The console references public OpenAPI operation IDs only.
- The console must not import OmniWA backend packages, Application
  commands/queries, Domain concepts, or Provider code.
- The console contains no business logic; it renders resources and submits
  commands through the public API.
- All REST access goes through the generated client boundary in `src/api/`;
  feature code never calls `fetch` against the platform directly.

## Stack

| Concern | Choice |
| --- | --- |
| Build | Vite |
| UI | React 18 + TypeScript |
| Routing | React Router |
| Server state | TanStack Query |
| API types | `openapi-typescript` (generated from the vendored contract) |
| API calls | `openapi-fetch` (typed thin client over `fetch`) |
| Styling | Tailwind CSS v4 |
| Realtime | Native `EventSource` over `GET /v1/events/stream` |

## Documentation

| Document | Contents |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, module boundaries, dependency rules |
| [docs/PANELS.md](docs/PANELS.md) | Every console panel and the operation IDs it uses |
| [docs/API_CLIENT.md](docs/API_CLIENT.md) | Generated client, envelopes, pagination, error handling |
| [docs/AUTH_AND_SESSION.md](docs/AUTH_AND_SESSION.md) | API key entry, storage, and scope handling |
| [docs/REALTIME.md](docs/REALTIME.md) | SSE ingestion, reconnect, cache invalidation |
| [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) | Milestones and per-panel build order |
| [docs/INSTANCES_CONTRACT_GAPS.md](docs/INSTANCES_CONTRACT_GAPS.md) | Contract gaps discovered while implementing Instances |
| [AGENTS.md](AGENTS.md) | Working agreement for AI coding agents in this repo |

## Development

```bash
pnpm install          # install dependencies
pnpm contract:sync    # copy the OpenAPI spec from the sibling omniwa repo
pnpm api:generate     # regenerate src/api/generated/schema.d.ts from the contract
pnpm dev              # start the dev server (default http://localhost:5173)
pnpm check            # typecheck + build
```

The console talks to a running OmniWA API (default `http://localhost:3000`).
The API base URL and key are entered on the connect screen at runtime; nothing
is baked into the build.

## OmniWA Platform Dependency

`omniwa-console` depends on OmniWA Platform exposing stable external contracts:

- REST API endpoints under `/v1`.
- OpenAPI specification (vendored at `contracts/omniwa-v1.openapi.json`).
- `x-api-key` header authentication.
- Success / collection / error envelopes.
- Cursor pagination, filtering, and sorting conventions.
- SSE event stream (`streamEvents`).

## License

UNLICENSED (private, pre-release).

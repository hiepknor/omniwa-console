# Documentation Index

This directory holds the reference, contract, and delivery documentation for
`omniwa-console`. Start with [`../README.md`](../README.md) for the product
overview and [`../AGENTS.md`](../AGENTS.md) for the mandatory repository rules,
then open the document that covers your task below.

## Contract and backend

| Document | Purpose |
| --- | --- |
| [OMNIWA_GO_CONTRACT.md](OMNIWA_GO_CONTRACT.md) | Backend handoff: authentication, capabilities, projection envelopes, errors, and health semantics |
| [CONTRACT_UI_MATRIX.md](CONTRACT_UI_MATRIX.md) | Reviewed UI disposition for every public contract operation |
| [CONTRACT_BACKLOG.md](CONTRACT_BACKLOG.md) | Deferred and external decision units, accountable roles, and exit criteria |
| [PANELS.md](PANELS.md) | Panel ownership and integration status by `METHOD /path` |
| [CAMPAIGNS.md](CAMPAIGNS.md) | Campaign contract, recipient/consent model, and planned UI |
| [RATE_LIMIT.md](RATE_LIMIT.md) | Information-query and outbound rate-limit behavior |
| [REALTIME.md](REALTIME.md) | Browser realtime posture and durable event recovery |
| [UNSUPPORTED_SURFACES.md](UNSUPPORTED_SURFACES.md) | Routes with no public OmniWA GO management API |

## Architecture and client

| Document | Purpose |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | SPA layers, state ownership, and safety boundaries |
| [API_CLIENT.md](API_CLIENT.md) | Generated client, envelopes, errors, cursors, and query keys |
| [AUTH_AND_SESSION.md](AUTH_AND_SESSION.md) | Runtime key entry, credential scope, and session storage |
| [FEEDBACK.md](FEEDBACK.md) | Feedback and projection-state presentation |

## Delivery and roadmap

| Document | Purpose |
| --- | --- |
| [DELIVERY_WORKFLOW.md](DELIVERY_WORKFLOW.md) | Required delivery lifecycle from intake through merge |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Ordered OmniWA GO integration phases |
| [REDESIGN_BRIEF.md](REDESIGN_BRIEF.md) | Contract-first UI redesign architecture, migration order, and cutover gates |
| [UI_V2_GUIDE.md](UI_V2_GUIDE.md) | Canonical v2 foundation, state model, route behavior, and review contract |

## Deployment and rollout evidence

| Document | Purpose |
| --- | --- |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Immutable image build, generation isolation, and promotion gates |
| [UI_V2_ROLLOUT_EVIDENCE.md](UI_V2_ROLLOUT_EVIDENCE.md) | Generation-isolated v2 artifact promotion record |
| [CREDENTIAL_ROLLOUT_EVIDENCE.md](CREDENTIAL_ROLLOUT_EVIDENCE.md) | C2–C4 credential migration observation and approvals |

## Documentation conventions

These conventions keep the documentation consistent and are enforced in review:

- **Product names.** Use **Console** as the product proper noun in prose and
  **OmniWA GO** for the backend product. Use code font for repositories,
  packages, and paths (`omniwa-console`, `omniwa-go`, `src/api/`), and for
  identifiers and labels (`cc.onio.console.ui-generation`). The build flag value
  `v2` stays lowercase everywhere, including titles.
- **Titles.** Every document opens with a single Title Case `#` heading; section
  headings use sentence case.
- **Purpose first.** The first paragraph states what the document governs. A
  document or section that tracks progress adds a bold **`Status:`** line
  directly under its heading.
- **Cross-references.** Link with relative Markdown paths and no `./` prefix
  (`PANELS.md` from within `docs/`, `docs/PANELS.md` from the repository root).
- **Authority.** The vendored contract at `contracts/omniwa-go.openapi.json` is
  authoritative for paths and schemas; documents record only the cross-cutting
  semantics that generated types cannot express.

`pnpm docs:check` verifies that every relative link resolves, that no retired
document is referenced, and that `PANELS.md` lists only real contract
operations.

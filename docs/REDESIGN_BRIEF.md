# Contract-First UI Redesign

**Status:** route implementation complete; immutable rollout and legacy deletion pending.

This brief replaces panel-by-panel visual patching with a contract-first rebuild
of the Console presentation layer. The current public routes stay operational
until their v2 replacements satisfy the cutover gates below. Findings from the
closed Instances patch PR remain evidence, but its implementation is not a base
for the redesign.

## Why a rebuild is required

The current UI has three structural sources of drift:

1. Runtime styles and static prototype styles are maintained as separate large
   stylesheets and copied by line reference.
2. Feature panels combine shared geometry, resource state and local styling,
   so fixing one viewport can change another panel through the cascade.
3. Primary navigation includes surfaces with no public OmniWA GO management
   contract, while newly available operational contracts are not represented.

The redesign treats the backend contract and production components as the two
sources of truth. Static mockups may illustrate a workflow, but they no longer
own CSS or component geometry.

## Authoritative inputs

Use these sources in order:

1. `../omniwa-go/docs/swagger.json` — backend source contract, synchronized by
   the orchestrator.
2. `contracts/omniwa-go.openapi.json` — vendored build contract.
3. `src/api/generated/schema.d.ts` — generated TypeScript boundary.
4. [CONTRACT_UI_MATRIX.md](CONTRACT_UI_MATRIX.md) — reviewed scope, capability,
   mode, workflow and product disposition for every operation.
5. [PANELS.md](PANELS.md) — operation ownership of implemented and approved
   panels.
6. Production tokens and shared components — canonical visual implementation.
7. [UI_V2_GUIDE.md](UI_V2_GUIDE.md) — canonical implemented presentation,
   route, state, and review behavior.

Backend source may clarify middleware and runtime semantics, but no private Go
type or route crosses into the SPA.

## Product boundaries

- The redesign covers every existing Console journey, not every endpoint in
  Swagger.
- An endpoint becomes visible only as part of a complete operator workflow.
- Queue, webhook administration, global settings and API-key management stay
  out of primary navigation while no public contract exists.
- Public passkey ceremony endpoints belong to the browser extension and are not
  Console routes.
- Backend operations marked `deferred-backend-risk` remain unavailable until
  their backend behavior is supported and verified.
- No migration may restore token persistence, token rendering in ordinary
  resource views, live-query fan-out or automatic mutation retries.

## Information architecture

| Area | Operator purpose | Contract families |
| --- | --- | --- |
| Platform | See overall availability and projection posture | `/server/capabilities`, `/server/overview`, `/server/health`, `/server/projection-health` |
| Recovery | Inspect and resolve terminal projection failures | `/server/projection-failures*` |
| Instances | Manage fleet metadata, pairing, connection and settings | `/instance/*` approved in the matrix |
| Conversations | Inspect chats/messages and submit bounded sends | `/chat/*`, `/message/*`, `/send/text`, `/send/media` |
| Contacts | Search contacts and labels from projections | `/user/contact*`, `/label/*` approved in the matrix |
| Groups | Inspect and manage groups | `/group/*` approved in the matrix |
| Delivery | Create and operate campaigns | `/campaigns*` |
| Observability | Search normalized durable history | `/events` |

The shell exposes the active environment and credential scope at all times.
Platform/admin context and instance/token context are separate navigation and
query scopes; the UI never asks an operator to infer scope from page content.

## Shared state model

Every v2 resource surface composes the same independent state axes:

| Axis | Required states |
| --- | --- |
| Session | disconnected, validating, admin, instance, invalid |
| Capability | discovering, supported, unsupported, legacy-compatible |
| Projection | not-started, syncing, ready, stale, failed |
| Resource | initial-loading, empty, ready, refreshing, refresh-failed |
| Transport | online, unreachable, rate-limited, authentication-failed |
| Command | idle, pending, acknowledged, uncertain, failed |

An empty collection is valid only when the resource read is authoritative.
Stale data remains visible. Command acknowledgement never claims WhatsApp
delivery, campaign completion or final projection state.

## Design foundation

The v2 foundation must be implemented before migrating feature panels:

- one token source for color, type, spacing, radius and semantic status;
- a layered base reset that cannot override component utilities accidentally;
- shared shell, page header, scope switcher, table/list, inspector, tabs, form,
  dialog, feedback and projection-state components;
- production-component gallery for all variants and states;
- no panel-specific table, drawer, dialog or responsive shell geometry;
- no static prototype stylesheet copied into runtime;
- relative timestamps with absolute values available to assistive/hover users;
- identifiers rendered in mono with a consistent copy affordance;
- status always expressed by label as well as color.

Adding a visual-regression dependency requires orchestrator installation. Until
then, deterministic screenshot fixtures use the production component gallery
and the browser tooling already available in the environment.

## Delivery sequence

Each item is a separate branch and pull request created from the latest
`origin/main`. A v2 generation flag keeps incomplete work off Production while
allowing full Staging review; it must not alter API or credential behavior.

1. **Contract baseline** — this brief, the complete operation matrix, automated
   coverage gate and panel ownership corrections.
2. **Foundation** — layered reset, tokens, primitives and production component
   gallery. No feature migration.
3. **State model** — shared session/capability/projection/resource/transport/
   command presentation and regression fixtures.
4. **Shell and Connect** — environment, scope, navigation and memory-only
   credential journey.
5. **Platform and Recovery** — overview, split health, projection health and
   projection-failure operations.
6. **Instances** — fleet first, then a coherent detail workspace for pairing,
   connection, settings, credential rotation and observation facts.
7. **Conversations** — chats, messages, contacts, labels and bounded text/media
   sends.
8. **Groups** — projection list/search/detail and verified group commands.
9. **Campaigns and Events** — campaign lifecycle/recipients/audit and durable
   event history.
10. **Cutover and deletion** — Production enablement followed by removal of the
    legacy shell, feature presentation, static prototypes and dead CSS.

No migration PR adds an isolated v2 card to a legacy page. A vertical slice
replaces its full route-level journey behind the generation boundary.

## Verification contract

Every vertical slice must provide evidence for:

- admin and instance credential scope where applicable;
- capability discovering/supported/unsupported behavior;
- initial loading, authoritative empty, ready, syncing, stale, not-ready,
  refresh failure and normalized error states;
- rate-limit header precedence and independent information/outbound cooldowns;
- mutation duplicate-submit prevention, acknowledgement wording, uncertainty
  and narrow invalidation;
- direct link, refresh, browser back/forward and filter/cursor reset;
- keyboard order, visible focus, focus restoration and accessible status text;
- 360, 768, 1024 and 1440 pixel viewport evidence;
- no page-level horizontal overflow;
- no credential in storage, URL, query keys, logs or rendered diagnostics;
- `git diff --check`, `pnpm test` and `pnpm check`.

## Staging and Production cutover

Staging enables v2 slices as they become complete. Production remains on the
legacy generation until all route-level slices and security checks pass. The
final cutover requires:

1. representative non-empty workloads as well as authoritative empty states;
2. documented review of stale/syncing/not-ready and rate-limited behavior;
3. destructive-command and one-time-secret exercises;
4. responsive and keyboard evidence for every route;
5. immutable artifact identity and rollback instructions;
6. Product, Console, Backend, Security and Operations approval.

Legacy code is deleted only after Production cutover is verified. The rollback
may switch presentation generation, but may not reintroduce known credential or
contract violations.

## Completion definition

The redesign is complete only when all `redesign-v2` operations in the Contract
UI Matrix are owned by implemented panels, every current Console journey has a
v2 route or an explicit contract-backed removal decision, Production runs v2,
and the legacy presentation/prototype CSS has been removed.

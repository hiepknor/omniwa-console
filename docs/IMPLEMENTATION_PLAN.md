# Implementation Plan

Status: M0–M7 are complete as of 2026-07-19. M6.5 campaigns and the Groups
Named-Lists mode remain blocked pending the platform contract; contract gaps
are recorded in the five `*_CONTRACT_GAPS.md` documents.

Milestones are ordered so every milestone ends with a running, verifiable
console. Each panel milestone includes its query hooks, routes, loading /
empty / error states, and envelope-correct pagination.

## M0 — Foundation (scaffold, done)

- Vite + React + TypeScript project with Tailwind, React Router,
  TanStack Query.
- Vendored contract, `contract:sync` and `api:generate` scripts, generated
  schema committed.
- `src/api/` boundary: client factory, envelope helpers, query-key helpers.
- `src/lib/session.ts`, connect screen, authenticated shell layout with
  sidebar navigation and route stubs for every panel.
- `pnpm check` (typecheck + build) green.

## M1 — Connect + Overview (done)

- Connect screen probes `getHealth`, stores session, redirects.
- Overview panel: dashboard summary, metric cards, action-required list.
- Error envelope rendering (category, message, requestId) and 401-clears-
  session behavior wired globally.

Exit: operator can connect to a local platform and read real state.

## M2 — Instances (done)

- Instance list + detail, create/update forms, connect/disconnect/
  reconnect, QR pairing view (poll `refreshInstanceQr` until paired),
  sessions list, provider capabilities, destroy with typed confirmation.

Exit: full instance lifecycle from the browser, including first-time QR
pairing.

## M3 — Workspace core (primary surface, done)

- Three-pane workspace: conversation list (chats with search/label filters),
  message timeline with bubble statuses, composer (text + media via
  `registerMedia`), retry/cancel, delivery timeline in the context panel.
- Async-accepted rendering on bubbles; disconnected-instance composer state.

Exit: operator can converse and trace any message end to end from one screen.

## M4 — Realtime (done)

- SSE client (fetch-based reader), invalidation mapping, live indicator,
  reconnect/backoff, polling fallback, event ticker on Overview.

Exit: instance and queue panels update without manual refresh.

## M5 — Operations panels (done)

- Queue & Jobs (status, job browser, detail drawer).
- Webhooks (register, lifecycle, deliveries, single + bulk redrive).
- Events (history + live tail, audit records).

Exit: operational troubleshooting parity with `omniwa-tui`.

## M6 — Workspace completion + Directory + Settings (done)

- Contract-backed group management workbench (metadata, local state, member
  commands, invite-link refresh acceptance, and one-off text commands).
- Contact and label directory reads embedded in the Chats workspace, including
  jump-to-conversation flows supported by the v1 contract.
- Settings (get / validate / activate) and admin-keys panel (admin scope
  only, show-once secret dialog).
- Named Lists and bulk selection shipped deferred pending the platform
  contract.

Exit: the currently available v1-contract operations assigned in
`docs/PANELS.md` are represented. Contract-blocked enhancements remain tracked
in `docs/M6_CONTRACT_GAPS.md` and are not emulated in browser state.

## M6.5 — Campaigns, Named Lists, and send lists (blocked on platform contract)

- Blocked until the operations in `docs/CAMPAIGNS_PROPOSAL.md` and the Named
  Lists operations described in `docs/M6_CONTRACT_GAPS.md` exist in the
  platform OpenAPI contract. Then: reusable group lists, send-list CRUD,
  campaign wizard, campaign monitoring with segmented progress, and
  per-recipient drill-down.

Exit: an opt-in notification campaign can be created, observed, paused, and
aborted entirely through platform APIs.

## M7 — Hardening (done)

- Deep-link audit (filters and cursors in URL params).
- Accessibility pass (keyboard navigation, focus management in dialogs).
- Bundle audit and route-level code splitting.
- Production navigation exposes only contract-backed surfaces; blocked routes
  remain available as explicit direct-link explanations.
- Route-aware document titles, a skip-to-content link, mobile-first connection
  ordering, and compact transport-outage reporting improve orientation and
  recovery without duplicating the same failure across dashboard sections.
- Automated architecture and bundle checks protect API and feature boundaries,
  the single main landmark, route splitting, and the per-chunk size budget.
- Propose the extended web dashboard profile back to the platform repo's
  `platform_clients.rs` so the SDK profile matches shipped reality.

## Verification per milestone

- `pnpm check` must pass (typecheck + production build).
- Manual verify against a locally running OmniWA API (see `docs/api/` in
  the platform repo for runtime setup).
- No feature imports another feature; no `fetch` outside `src/api/`; feature
  panels do not introduce additional `main` landmarks. These boundaries are
  enforced by `pnpm architecture:check` as part of `pnpm check`.
- Route chunks remain below the documented 300 KiB raw-JavaScript budget and
  route-level splitting is verified by `pnpm bundle:check` after every build.

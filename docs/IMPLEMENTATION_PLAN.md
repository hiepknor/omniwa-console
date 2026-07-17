# Implementation Plan

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

## M1 — Connect + Overview

- Connect screen probes `getHealth`, stores session, redirects.
- Overview panel: dashboard summary, metric cards, action-required list.
- Error envelope rendering (category, message, requestId) and 401-clears-
  session behavior wired globally.

Exit: operator can connect to a local platform and read real state.

## M2 — Instances

- Instance list + detail, create/update forms, connect/disconnect/
  reconnect, QR pairing view (poll `refreshInstanceQr` until paired),
  sessions list, provider capabilities, destroy with typed confirmation.

Exit: full instance lifecycle from the browser, including first-time QR
pairing.

## M3 — Workspace core (primary surface)

- Three-pane workspace: conversation list (chats with search/label filters),
  message timeline with bubble statuses, composer (text + media via
  `registerMedia`), retry/cancel, delivery timeline in the context panel.
- Async-accepted rendering on bubbles; disconnected-instance composer state.

Exit: operator can converse and trace any message end to end from one screen.

## M4 — Realtime

- SSE client (fetch-based reader), invalidation mapping, live indicator,
  reconnect/backoff, polling fallback, event ticker on Overview.

Exit: instance and queue panels update without manual refresh.

## M5 — Operations panels

- Queue & Jobs (status, job browser, detail drawer).
- Webhooks (register, lifecycle, deliveries, single + bulk redrive).
- Events (history + live tail, audit records).

Exit: operational troubleshooting parity with `omniwa-tui`.

## M6 — Workspace completion + Directory + Settings

- Group conversations in the workspace (sender attribution, group context
  panel: members, promote/demote/remove, invite link).
- Directory (contacts + labels, jump-to-conversation).
- Settings (get / validate / activate) and admin-keys panel (admin scope
  only, show-once secret dialog).

Exit: full v1-contract surface from `docs/PANELS.md` complete.

## M6.5 — Campaigns & send lists (blocked on platform contract)

- Blocked until the operations in `docs/CAMPAIGNS_PROPOSAL.md` exist in the
  platform OpenAPI contract. Then: send lists CRUD, campaign wizard,
  campaign monitoring with segmented progress and per-recipient drill-down.

Exit: an opt-in notification campaign can be created, observed, paused, and
aborted entirely through platform APIs.

## M7 — Hardening

- Deep-link audit (filters and cursors in URL params).
- Accessibility pass (keyboard navigation, focus management in dialogs).
- Bundle audit and route-level code splitting.
- Propose the extended web dashboard profile back to the platform repo's
  `platform_clients.rs` so the SDK profile matches shipped reality.

## Verification per milestone

- `pnpm check` must pass (typecheck + production build).
- Manual verify against a locally running OmniWA API (see `docs/api/` in
  the platform repo for runtime setup).
- No feature imports another feature; no `fetch` outside `src/api/`
  (enforced by review; lint rule candidate for M7).

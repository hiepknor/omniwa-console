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

## M3 — Messages

- Message history with cursor pagination and filters, message detail with
  delivery timeline, compose text + media (via `registerMedia`), retry /
  cancel, async-accepted status rendering.

Exit: operator can send and trace a message end to end.

## M4 — Realtime

- SSE client (fetch-based reader), invalidation mapping, live indicator,
  reconnect/backoff, polling fallback, event ticker on Overview.

Exit: instance and queue panels update without manual refresh.

## M5 — Operations panels

- Queue & Jobs (status, job browser, detail drawer).
- Webhooks (register, lifecycle, deliveries, single + bulk redrive).
- Events (history + live tail, audit records).

Exit: operational troubleshooting parity with `omniwa-tui`.

## M6 — Resource browsers + Settings

- Chats, Contacts, Labels browsers (read-only).
- Groups (browser, members, member ops, invite link, group text send).
- Settings (get / validate / activate) and admin-keys panel (admin scope
  only, show-once secret dialog).

Exit: full resource console surface from `docs/PANELS.md` complete.

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

# AGENTS.md

Working agreement for AI coding agents in `omniwa-console`.

## What this repo is

A standalone React + Vite SPA operations console for OmniWA Platform.
API-client-only: it consumes the public REST contract and contains no
backend or business logic. Read `README.md` first, then the doc that covers
your task in `docs/`.

## Hard boundaries

- Never import from the `omniwa` platform repo. The only artifact that
  crosses over is the vendored OpenAPI file in `contracts/`, refreshed via
  `pnpm contract:sync`.
- Never edit `src/api/generated/` by hand — regenerate with
  `pnpm api:generate`.
- All network access goes through `src/api/`. No `fetch` in features or
  components.
- A panel may only call the operation IDs assigned to it in
  `docs/PANELS.md`. If a task needs an operation the panel does not own,
  update `docs/PANELS.md` in the same change and say so.
- Features never import other features.

## Environment constraints

- The implementing agent sandbox has **no network access**. Do not run
  `pnpm install`, `pnpm add`, or anything that fetches. Dependencies are
  pre-installed; if a new package is needed, stop and request it — the
  orchestrator installs it and hands back control.
- `pnpm check` (typecheck + build) runs offline and must pass before a task
  is considered done.
- `pnpm contract:sync` requires the sibling `../omniwa` checkout; only the
  orchestrator runs it.

## Conventions

- TypeScript strict; no `any` unless quarantined in `src/api/` envelope
  narrowing with a comment.
- Server state via TanStack Query only; query keys follow
  `docs/API_CLIENT.md`. No hand-rolled caches.
- Filters, cursors, and selection state go in URL search params so panels
  deep-link.
- Every list panel ships loading, empty, and error states; error states
  show `error.details.category`, `message`, and `meta.requestId`.
- Async-accepted commands render acceptance, never completion (see
  `docs/API_CLIENT.md`).
- Tailwind for styling; compose utilities in components rather than
  writing CSS files.

## Definition of done for a task

1. `pnpm check` passes.
2. New routes/panels are reachable from the sidebar and render all three
   states (loading / empty / error).
3. `docs/PANELS.md` still matches the operations actually called.
4. No boundary violations from the list above.

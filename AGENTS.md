# AGENTS.md

Working agreement for AI coding agents in `omniwa-console`.

## What this repo is

A standalone React + Vite SPA operations console for OmniWA GO.
API-client-only: it consumes the public REST contract and contains no
backend or business logic. Read `README.md` first, then the doc that covers
your task in `docs/`.

## Hard boundaries

- Never import backend source from `omniwa-go`. The only artifact that crosses
  over is the vendored OpenAPI file in `contracts/`, refreshed via
  `pnpm contract:sync` by the orchestrator.
- Never edit `src/api/generated/` by hand — regenerate with
  `pnpm api:generate`.
- All network access goes through `src/api/`. No `fetch` in features or
  components.
- A panel may only call the `METHOD /path` operations assigned to it in
  `docs/PANELS.md`. If a task needs an operation the panel does not own,
  update `docs/PANELS.md` in the same change and say so.
- Features never import other features.

## Environment constraints

- The implementing agent sandbox has **no network access**. Do not run
  `pnpm install`, `pnpm add`, or anything that fetches. Dependencies are
  pre-installed; if a new package is needed, stop and request it — the
  orchestrator installs it and hands back control.
- `pnpm check` runs the documentation, design, contract, architecture,
  typecheck, build, and bundle gates offline and must pass before a task is
  considered done.
- `pnpm contract:sync` requires the sibling `../omniwa-go` checkout; only the
  orchestrator runs it.

## Conventions

- TypeScript strict; no `any` unless quarantined in `src/api/` envelope
  narrowing with a comment.
- Server state via TanStack Query only; query keys follow
  `docs/API_CLIENT.md`. No hand-rolled caches.
- Filters, cursors, and selection state go in URL search params so panels
  deep-link.
- Every list panel ships loading, empty, and error states plus applicable
  projection syncing, stale, and not-ready states. Error states show the
  normalized `ApiFailure` code/category, message, and request ID when present.
- Commands render the server acknowledgement without implying WhatsApp
  delivery or campaign completion (see `docs/API_CLIENT.md`).
- Tailwind for styling; compose utilities in components rather than
  writing CSS files.

## Git and pull-request workflow

Follow the complete lifecycle in `docs/DELIVERY_WORKFLOW.md`. The rules below
are mandatory summaries, not a replacement for that document.

- Every task that changes files must use a new branch created from the latest
  `origin/main`. Never commit directly to `main`.
- Use one branch and one pull request per task. Branch names use the
  `feat/<slug>`, `fix/<slug>`, or `docs/<slug>` convention.
- Before implementation, verify the worktree state, fetch `origin`, and create
  the task branch from `origin/main`. Preserve unrelated user changes and never
  include them in the task commit.
- After implementation, self-review the complete diff, run `git diff --check`,
  `pnpm test`, and `pnpm check`, commit only task-owned files, push the branch
  to `origin`, and create a GitHub pull request targeting `main`.
- Pull request descriptions must summarize the change, list verification
  performed, call out contract or `docs/PANELS.md` changes when applicable,
  and state material risk, rollback, and deliberately deferred work.
- Do not merge a pull request unless the user explicitly requests it.
- Read-only investigation or review tasks that produce no file changes do not
  require a branch or pull request.

## Definition of done for a task

1. `git diff --check`, `pnpm test`, and `pnpm check` pass.
2. New routes/panels are reachable from the sidebar and render all applicable
   states: loading, empty, ready, stale/syncing/not-ready, and error.
3. `docs/PANELS.md` still matches the operations actually called.
4. Mutations prevent duplicate submission, represent server acknowledgement
   accurately, and refresh the narrowest affected projection.
5. The complete branch diff has been self-reviewed for correctness, security,
   cleanup/race behavior, accessibility, responsive behavior, and scope drift.
6. No boundary violations from the list above.

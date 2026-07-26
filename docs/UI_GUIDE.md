# UI Guide

This document is the implementation and review contract for the OmniWA Console
presentation. The application has one route manifest, one design system, and one
production artifact.

## Foundation

- `src/ui/` owns shared presentation primitives and interaction behavior.
- `src/styles/index.css` owns Tailwind theme tokens and global base styles.
- `src/app/` owns session connection, shell, navigation, routing, and providers.
- `src/features/<feature>/` owns a route-level feature. Features never import
  other features.
- `src/api/` is the only network boundary. Feature code consumes normalized
  resources and `ApiFailure`, never raw responses.

Use the established monochrome, square, dense visual language. Compose Tailwind
utilities in components; do not add feature CSS files. Extend a shared primitive
when behavior is repeated across routes.

## State model

Resource panels represent independent state axes instead of collapsing them into
one loading boolean:

| Axis | Required states |
|---|---|
| Request | idle, loading, success, error |
| Data | empty, ready |
| Projection | not ready, syncing, ready, stale, failed when applicable |
| Capability | discovering, supported, unsupported |
| Command | idle, pending, acknowledged, failed |

Every list route renders loading, empty, ready, and normalized error states.
Projection-backed routes also render not-ready, syncing, and stale states.
Errors show the `ApiFailure` category/code, message, and request ID when present.

Commands disable duplicate submission and render only the server
acknowledgement. They must not imply WhatsApp delivery, projection convergence,
or campaign completion. Refresh the narrowest affected query after success.

## Routing and scope

Filters, cursors, selected resources, and inspector state belong in URL search
parameters so routes deep-link and browser navigation remains deterministic.
Use `src/lib/url-search-state.ts`; do not mutate `URLSearchParams` ad hoc.

The connected credential determines the available navigation and API scope:

- admin keys expose platform overview, recovery when advertised, and instance
  fleet management;
- instance API keys expose conversations, groups, campaigns, and events;
- instance-scoped live commands require an in-memory instance token where the
  active session does not already provide that scope.

Never persist credentials or place credential values in URLs, query keys, logs,
resource models, or rendered diagnostics.

## Interaction contract

- Dialogs and drawers trap focus, restore focus on close, have an accessible
  name, and declare whether pending commands can close.
- Interactive table rows support keyboard activation and expose selection.
- Destructive commands state their exact target and require explicit intent.
- Loading and refresh behavior uses `src/lib/query-policy.ts`; routes do not own
  numeric polling intervals.
- Preview routes under `/__preview/*` are development-only and use production
  components with deterministic fixtures.

## Review checklist

Before delivery, verify:

1. The route is reachable from the correct scoped navigation.
2. URL state survives reload and browser back/forward navigation.
3. Loading, empty, ready, projection, capability, and error states are honest.
4. Commands prevent duplicates and describe acknowledgement accurately.
5. Keyboard, focus, labeling, responsive layout, and reduced-motion behavior
   remain usable.
6. `docs/PANELS.md` lists every operation called by the feature.
7. `git diff --check`, `pnpm test`, and `pnpm check` pass.

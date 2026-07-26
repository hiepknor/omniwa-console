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

The frozen token, geometry, elevation, state, exception, and change-control
rules live in [`../design/DESIGN.md`](../design/DESIGN.md). Every intentional
visual-language change updates that contract, `/__ui`, regression coverage, and
Chrome desktop/mobile evidence in the same pull request.

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
- instance API keys expose the active Instance destination (including
  connection/pairing), conversations, groups,
  campaigns, and events;
- instance-scoped live commands require an in-memory instance token where the
  active session does not already provide that scope.
- instance scope never invents or requests the configured admin Instance Name;
  a non-empty status name is presented as WhatsApp name only after login.

Never persist credentials or place credential values in URLs, query keys, logs,
resource models, or rendered diagnostics.

## Interaction contract

- Dialogs and drawers use the shared framed overlay treatment, lock background
  scrolling, trap and restore focus, have an accessible name, and declare
  whether pending commands can close.
- Interactive table rows support keyboard activation and expose selection.
- Custom selectors follow the ARIA combobox/listbox pattern, retain an active
  option, and support arrows, Home/End, typeahead, Enter/Space, Escape, and Tab.
- Buttons preserve a clear ghost/primary/danger hierarchy, expose pressed and
  keyboard-focus feedback, and use `ButtonLink` for navigation styled as an action.
- Destructive commands state their exact target and require explicit intent.
- Loading and refresh behavior uses `src/lib/query-policy.ts`; routes do not own
  numeric polling intervals.
- Preview routes under `/__preview/*` are development-only integration
  fixtures. They reuse the corresponding production view and shared
  composition primitives; they are not an independent prototype or a source
  of visual rules. Fixture-only content may exercise deterministic states, but
  shared frames and interactions stay owned by `src/ui/`.

## Review checklist

Before delivery, verify:

1. The route is reachable from the correct scoped navigation.
2. URL state survives reload and browser back/forward navigation.
3. Loading, empty, ready, projection, capability, and error states are honest.
4. Commands prevent duplicates and describe acknowledgement accurately.
5. Keyboard, focus, labeling, responsive layout, and reduced-motion behavior
   remain usable.
6. Hover/open/selected states keep labels and icons visible and do not depend on
   conflicting utility order.
7. No unapproved radius, chroma, blur, soft shadow, decorative gradient, or
   feature-local visual primitive was introduced.
8. `docs/PANELS.md` lists every operation called by the feature.
9. `git diff --check`, `pnpm test`, and `pnpm check` pass.

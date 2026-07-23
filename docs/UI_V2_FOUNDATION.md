# UI v2 Foundation

This document records the first implementation boundary for the contract-first
redesign. It is intentionally independent of feature APIs and can be reviewed
without an authenticated backend session.

## Canonical sources

- `src/styles/tokens.css` is the only token declaration source.
- `design/prototypes/console.css` imports those tokens and may not redeclare
  them.
- `src/components/v2/` contains production primitives.
- `src/styles/ui-v2.css` owns only `ui-v2-*` selectors.
- `/__ui-v2` renders the production primitives in local development and is
  absent from Production routing and JavaScript output.

`pnpm design:check` enforces these boundaries.

## Cascade isolation

The shared document reset is in the CSS base layer. Existing Shell and Connect
markup carry `ui-legacy-root`, which preserves the historical unlayered reset
until each complete route is replaced. V2 components use unique semantic class
names imported after legacy feature CSS, so they do not depend on Tailwind
specificity or prototype selector order.

Do not add a v2 fix to `console.css`, reuse generic legacy selectors such as
`.btn`, `.card`, or `.drawer`, or copy styles from a static prototype. Extend a
production primitive and its gallery state instead.

## Initial primitives

| Primitive | Contract |
| --- | --- |
| `UiV2Boundary` | Declares the v2 generation scope without changing credential or query behavior |
| `PageHeader` | One page title, optional context, description and bounded actions |
| `Button` | Primary, secondary and danger intent; native disabled/submission semantics |
| `Status` | Semantic tone plus visible text; color is never the only signal |
| `Surface` | Shared section containment and header/action geometry |
| `Field` | Native label association, hint/error description and invalid state |
| `StateNotice` | Independent session/capability/projection/resource/transport/command presentation |
| `Tabs` | Controlled tab selection with arrow/Home/End keyboard navigation |
| `ScopeSelector` | Explicit platform/admin versus instance/token context selection |
| `Dialog` | Modal focus ownership, Escape/backdrop behavior and focus restoration |
| `Inspector` | Shared detail frame with modal or non-modal focus behavior |

The gallery also exercises the first responsive resource-table treatment.
Feature migrations must map API facts into these contracts rather than adding
panel-specific state or overlay geometry.

## Review matrix

Review `/__ui-v2` at 360, 768, 1024 and 1440 CSS pixels. Confirm:

- no page-level horizontal overflow;
- touch controls are at least 44px at the compact breakpoint;
- the resource table becomes a continuous labeled row layout on mobile;
- every status has readable text;
- field errors are associated with their input;
- keyboard focus is visible;
- reduced-motion preference removes non-essential transition duration.

The legacy `/connect` route and one static prototype are rendered after token or
reset changes to prove that the compatibility boundary did not restyle them.

## Removal gate

`ui-legacy-root`, static prototype styles and the legacy reset compatibility
rule are removed only after all Production routes run v2 and post-cutover
verification succeeds.

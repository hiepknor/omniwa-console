# Legacy Retirement Plan

This plan describes how the legacy UI generation is converged onto v2 and then
removed. It exists because the Console currently ships two isolated presentation
generations selected at build time, and the redesign completion contract in
[REDESIGN_BRIEF.md](REDESIGN_BRIEF.md) requires deleting the legacy shell,
feature presentation, and dead CSS after Production runs v2.

**Status:** planning only. No legacy-removal change may merge yet. Production
still runs the legacy generation and the five cutover approvals in
[UI_V2_ROLLOUT_EVIDENCE.md](UI_V2_ROLLOUT_EVIDENCE.md) are pending; until then
legacy is the sole rollback asset and must stay intact.

## Governing constraints

- **Deletion is gated.** Per [DEPLOYMENT.md](DEPLOYMENT.md), legacy source,
  compatibility CSS, and prototype presentation are deleted only in a later PR
  after Production v2 is verified and all five owner approvals are recorded.
- **Rollback safety.** While Production serves legacy, the legacy artifact is the
  rollback target. Removing the build-time generation switch is the point after
  which rollback means redeploying the previous legacy image digest, not
  toggling a flag.
- **Delivery discipline.** Every step is an independent, reversible branch and
  pull request per [DELIVERY_WORKFLOW.md](DELIVERY_WORKFLOW.md). `pnpm check`
  stays green at each step.
- **Invest only in v2.** Legacy is terminal, so no new shared component,
  refactor, or test is added to legacy code.

## Coverage: legacy is already superseded

Every backend-supported legacy route already has a v2 replacement; the only
legacy-only routes are the unsupported surfaces that v2 deliberately drops
(see [UNSUPPORTED_SURFACES.md](UNSUPPORTED_SURFACES.md)).

| Legacy route | v2 replacement | Disposition |
| --- | --- | --- |
| `/overview` | `OverviewPageV2` | Replaced |
| `/instances` | `InstancesPageV2` | Replaced |
| `/chats` | `ConversationsPageV2` | Replaced (renamed Conversations) |
| `/groups` | `GroupsPageV2` | Replaced |
| `/messages`, `/messages/new` | `CampaignsPageV2`, `CreateCampaignV2` | Replaced |
| `/events` | `EventsPageV2` | Replaced |
| — | `RecoveryPageV2` (`/recovery`) | v2-only addition |
| `/queue` | none | Drop — no public backend API |
| `/webhooks` | none | Drop — no public backend API |
| `/settings` | none | Drop — no public backend API |
| `/settings/api-keys` | none | Drop — no public backend API |

There is therefore no functional convergence work: retirement is a cutover and
deletion effort, not a legacy refactor.

## Keep vs delete inventory

Classification verified by real import references on the surviving surface
(v2 features, v2 shell, `App` runtime).

**Kept** (survives deletion):

- `src/components/v2/*` — v2 core primitives;
- `src/components/EnvironmentBadge.tsx`, `src/components/useDocumentTitle.ts` —
  used by `ShellV2`;
- `src/components/useDrawerFocus.ts` — used by the v2 `Inspector`;
- `src/components/feedback/*` — used by the shared `App` runtime;
- `src/api/*` (including `RealtimeProvider`), `src/lib/*`;
- `src/styles/tokens.css`, `src/styles/ui-v2.css`, `src/styles/base.css`.

**Deleted with legacy** (verified zero references on the surviving surface):

- feature directories: `overview`, `instances`, `chats`, `groups`, `campaigns`,
  `events`, `queue`, `webhooks`, `settings`, `api-keys`;
- legacy shell: `Shell.tsx`, `ConnectPage.tsx` (+ test), `connect-flow.ts`,
  `PanelStub.tsx`, `generation-legacy.tsx`, `generation.test.ts`;
- legacy-only components: `PageHeader`, `InlineError`, `ProjectionNotice`,
  `RealtimeIndicator`, `badges`, `IconButton`, `SelectDropdown`,
  `MobileFilterSheet`, `TokenField`, `SettingToggle`, `TypedConfirmationDialog`,
  `data-table/`, `drawer/DetailDrawer.tsx`, `dialog/`, `useModalDialog`
  (verify `Logo`, `retry-timing` at delete time);
- legacy CSS: `console.css`, `index-legacy.css`, `legacy-compat.css`.

> Gate dependency: `pnpm design:check` includes `check-table-contract`,
> `check-drawer-contract`, `check-dialog-contract`, `check-chat-workspace`,
> `check-connect-contract`, and `check-overview-contract`, which assert that
> legacy shared components exist. Deleting legacy turns them red, so the deletion
> PR must remove or rewrite those gates. The dual-generation gates
> `check-generation-artifact` and `check-ci-generations` are also removed when
> the build-time switch goes away.

## Track A — safe to do now

These merge before cutover because they neither touch legacy runtime nor remove
the rollback asset.

| PR | Scope | Why safe now |
| --- | --- | --- |
| A1 | Extract v2 shared components (`CursorPagination`, `PageGuard`, `DescriptionList`, `RelativeTime`, `StatusBadge`, `CommandAck`, `PagedSection`, and a v2 table primitive), replacing duplicated call sites | Improves only v2, which survives; shrinks the later canonical-rename surface |
| A2 | Commit this plan | Documentation only |
| A3 (optional) | Non-merged spike branch running Track B to prove a v2-only build compiles and to measure the final bundle | Evidence for the cutover decision; never merged |

## Track B — legacy deletion (merge only after cutover and approvals)

Execute in order; each PR keeps `pnpm check` green.

| PR | Scope | Verification |
| --- | --- | --- |
| B1 — retire the generation switch | Remove the conditional `@generation` / `@generation-styles` aliases in `vite.config.ts`; delete `src/lib/ui-generation.ts` and `generation-legacy.tsx`; import the v2 shell, routes, and styles directly in `App`; collapse `build:legacy`/`build:v2` into one `build` and drop `VITE_CONSOLE_UI_GENERATION`; simplify `ci.yml` to a single generation and tag; remove `check-generation-artifact` and `check-ci-generations` | Build produces only v2; legacy files become unreferenced dead code |
| B2 — delete legacy code | Remove every entry in the delete inventory; rewrite or remove the legacy `check-*-contract` gates in `design:check`; rename `index-v2.css` to `index.css` | `typecheck` and `build` prove no dangling references; `pnpm check` green |
| B3 — adopt canonical names | Drop the `-v2` / `V2` suffixes from directories, files, and exports; update the `check-ui-v2-*` scripts. Renaming the `ui-v2-*` CSS selectors is high-churn and may be a separate follow-up | `pnpm test`, `pnpm build` |
| B4 — documentation closeout | Update `DEPLOYMENT.md`, `REDESIGN_BRIEF.md`, `IMPLEMENTATION_PLAN.md`, `UI_V2_GUIDE.md`, `PANELS.md`, the rollout-evidence records, `README.md`, and `AGENTS.md` to describe a single shipped generation | `pnpm docs:check` |

Ordering is strict: B1 makes legacy dead code, B2 removes it, B3/B4 tidy the
result.

## Risk and rollback

- Before cutover only Track A merges; risk is minimal and each PR reverts
  cleanly.
- B1 is the point of no return for flag-based rollback. After it, rollback is a
  redeploy of the previously reviewed legacy image digest, which is exactly why
  the deletion is gated until Production v2 is verified and approved.

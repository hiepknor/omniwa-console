# UI v2 Cutover Readiness

Status: build artifacts isolated; Production promotion and legacy source
deletion remain operationally gated.

## Build graph isolation

The build resolves `@generation` and `@generation-styles` in `vite.config.ts`
before Rollup constructs the module graph.

```text
VITE_CONSOLE_UI_GENERATION=v2
  → generation-v2.tsx
  → index-v2.css

missing, invalid, or legacy value
  → generation-legacy.tsx
  → index-legacy.css
```

The v2 manifest owns only Overview, Recovery, Instances, Conversations, Groups,
Campaigns, and Events. Unsupported Queue, Webhooks, Global Settings, and Admin
Keys routes are absent and resolve through the authenticated wildcard redirect.
They are not hidden navigation items backed by shipped legacy JavaScript.

The audited credential probe lives in `connect-flow.ts`. Both presentation
generations import that flow, so the v2 graph does not import the legacy Connect
component merely to reuse authentication behavior.

## Artifact checks

Use these commands to produce and inspect each immutable presentation artifact:

```bash
pnpm build:v2
pnpm build:legacy
```

`scripts/check-generation-artifact.mjs` fails the v2 build if it contains:

- a legacy route chunk;
- legacy Queue, Webhook, Settings, or API-key runtime copy;
- `ui-legacy-root`, Connect, Events-workspace, or Settings-shell legacy CSS;
- a missing v2 route chunk.

The same checker requires the rollback artifact to retain its legacy route
chunks and compatibility CSS. The normal `pnpm check` validates whichever
generation the environment selects, so the OCI build checks its configured
artifact.

## Deliberate non-actions

This change does not:

- change the Docker default from `legacy`;
- promote an image to Staging or Production;
- claim representative workload, stale/not-ready/rate-limit, destructive
  command, or one-time-secret operational evidence;
- claim Product, Console, Backend, Security, or Operations approval;
- delete the separately buildable legacy rollback source.

Those actions remain ordered by `docs/REDESIGN_BRIEF.md`: promote the reviewed
v2 digest, verify Production, then delete legacy source and static presentation
assets in a later irreversible cleanup. Rollback always redeploys an already
reviewed immutable legacy digest; it never changes credential persistence.

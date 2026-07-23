# Immutable Console deployment

The Console ships as a non-root static OCI image. Runtime API origin and
credential selection remain operator input; no backend secret is baked into
the image.

Build only from a reviewed commit with a clean worktree:

```bash
revision=$(git rev-parse HEAD)
docker build \
  --build-arg VITE_CONSOLE_UI_GENERATION="legacy" \
  --build-arg OCI_REVISION="$revision" \
  --build-arg OCI_VERSION="sha-$revision" \
  --tag "omniwa-console:sha-$revision" \
  .
```

The UI generation is selected at build time and defaults closed to `legacy`.
Use `--build-arg VITE_CONSOLE_UI_GENERATION=v2` only for a reviewed v2 artifact.
Promotion must use the exact digest, and rollback redeploys the reviewed
legacy-generation digest.

## Generation and build-graph boundary

Vite resolves the complete route manifest and stylesheet entrypoint before
Rollup constructs the graph:

```text
VITE_CONSOLE_UI_GENERATION=v2
  → generation-v2.tsx
  → index-v2.css

missing, invalid, or legacy value
  → generation-legacy.tsx
  → index-legacy.css
```

The v2 artifact owns Overview, Recovery, Instances, Conversations, Groups,
Campaigns, and Events. It contains no legacy panels, compatibility CSS, or
unsupported Queue, Webhooks, Global Settings, and Admin Keys runtime. Both
generations import the same audited memory-only credential flow; presentation
rollback never changes credential lifetime or API behavior.

CI builds, smoke-tests, and publishes both isolated generations from every
merged `main` revision. The legacy compatibility tag remains
`sha-<revision>`; the reviewed v2 candidate is tagged
`sha-<revision>-v2`. These tags are discovery handles only: rollout records
must resolve and promote the repository digest. Both images carry the
`cc.onio.console.ui-generation` label, which must match the intended target
before deployment.

Before building OCI images, verify both isolated presentation graphs:

```bash
pnpm build:v2
pnpm build:legacy
```

V2 must not contain legacy route chunks or presentation CSS; the rollback
artifact must retain both. `scripts/check-generation-artifact.mjs` enforces
that isolation and verifies that every v2 route chunk is present.

Record the resulting repository digest, not only the mutable local tag. Promote
the exact digest across environments. The image listens on port `8080` and
serves `GET /healthz` without authentication. The bundled Nginx configuration
provides SPA route fallback, immutable caching for hashed assets, no-store for
the entry document, and browser security headers.

Example development deployment:

```bash
docker run --detach \
  --name omniwa-console \
  --publish 4173:8080 \
  "omniwa-console:sha-$revision"
curl --fail http://localhost:4173/healthz
```

After deployment, verify a deep link such as `/events`, inspect the OCI revision
label, and complete the credential rollout record. Never infer C3 completion
from container health alone.

## Promotion gates

Staging may run the reviewed v2 digest for evidence collection. Production
remains on the reviewed legacy digest until all of the following are recorded:

1. representative non-empty workloads and authoritative empty results;
2. stale, syncing, not-ready, normalized failure, and rate-limit exercises;
3. destructive-command, uncertain-command, and one-time-secret exercises;
4. keyboard and 360/768/1024/1440 responsive evidence for every route;
5. immutable revision, digest, generation label, health, deep-link, and
   rollback verification;
6. named Product, Console, Backend, Security, and Operations approvals.

The credential C3 observation and approvals remain separately recorded in
[CREDENTIAL_ROLLOUT_EVIDENCE.md](CREDENTIAL_ROLLOUT_EVIDENCE.md). A zero-instance
backend is not representative workload and does not start a quiet window.
UI-generation promotion evidence, unresolved exercises, and named cutover
approvals are recorded in
[UI_V2_ROLLOUT_EVIDENCE.md](UI_V2_ROLLOUT_EVIDENCE.md).

## Rollback and post-cutover deletion

Rollback redeploys the previously reviewed immutable legacy digest. Do not
rebuild from a moving branch, switch credential behavior, or treat container
health as application verification. Recheck `/healthz`, a direct SPA route,
the OCI revision, and the `cc.onio.console.ui-generation` label after rollback.

Legacy source, compatibility CSS, and static prototype presentation are deleted
only in a later PR after Production v2 is verified and all five approvals are
recorded. That cleanup removes the generation switch and adopts canonical names;
it is not part of promotion itself.

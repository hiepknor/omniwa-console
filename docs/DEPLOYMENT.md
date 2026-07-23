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
Use `--build-arg VITE_CONSOLE_UI_GENERATION=v2` only for a reviewed v2 artifact;
see [UI_V2_SHELL_CONNECT.md](UI_V2_SHELL_CONNECT.md). Promotion must use the
exact digest, and rollback redeploys the reviewed legacy-generation digest.

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
artifact must retain both. See
[UI_V2_CUTOVER_READINESS.md](UI_V2_CUTOVER_READINESS.md).

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

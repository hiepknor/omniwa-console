# Credential-safe Console rollout evidence

This record controls the C2-to-C4 credential migration. It is deliberately not
a `safeToRemove` calculation. Backend plaintext response or storage removal is
unauthorized until every C3 gate and owner approval below is recorded.

## C2 implementation baseline

| Evidence | Value |
| --- | --- |
| Console C2 merge | `302b9ca` (PR #20) |
| Credential regression gate | `5cf6031` (PR #21) |
| Existing-token memory workflow | `fc5b711` (PR #22) |
| Contract snapshot | 115 paths; credential metadata, rotation, and health included |
| Automated verification | `pnpm check`, `pnpm test`, `git diff --check` |
| Secret boundary | `pnpm credential:check` |

The implementation uses credential-free metadata for ordinary instance
list/detail reads when advertised. Old-backend fallback responses are adapted
through a view model that has no token field. Create and rotation secrets are
shown once and held in an in-memory vault only. An operator may attach an
existing token to that vault after reload and explicitly forget it.

## Deployment record

Do not start C3 until every supported Console environment is recorded here.

| Environment | Release commit | Immutable artifact digest | Completed at (UTC) | Operator | Verified |
| --- | --- | --- | --- | --- | --- |
| Development | `ba2f2cd08fc3763489fdd1c46ffb183ec0aeec80` (PR #28) | `ghcr.io/hiepknor/omniwa-console@sha256:ec43ccd37b2e06104905159f644c4d8a0b359e308d21d2fde36d8c43178be556` | 2026-07-23 02:07:33 | Codex | Yes |
| Staging | `fe4121cf87b8d4690bb087a87d858efdbcb49841` (PR #32) | `ghcr.io/hiepknor/omniwa-console@sha256:163f068e5acb6b60f59cd7a27b8d14d21ba0a2d04d02ce7f2cf3b804b6da5f59` | 2026-07-23 07:18:16 | Codex | Yes |
| Production | `fe4121cf87b8d4690bb087a87d858efdbcb49841` (PR #32) | `ghcr.io/hiepknor/omniwa-console@sha256:163f068e5acb6b60f59cd7a27b8d14d21ba0a2d04d02ce7f2cf3b804b6da5f59` | 2026-07-23 07:18:16 | Codex | Yes |

The development container remains pinned to the earlier multi-platform
registry digest, reports OCI revision
`ba2f2cd08fc3763489fdd1c46ffb183ec0aeec80`, runs as UID 101, and passed
`/healthz`, `/events` deep-link, SPA fallback, and Content-Security-Policy
checks. It was not part of the Staging and Production promotion.

Staging and Production run the PR #32 digest on separate loopback-bound
containers behind Caddy and Cloudflare at `staging-console.onio.cc` and
`console.onio.cc`. Both report OCI revision
`fe4121cf87b8d4690bb087a87d858efdbcb49841`, run as UID 101, use an
`unless-stopped` restart policy, and passed public HTTPS `/healthz`, `/events`
deep-link, SPA fallback, and security-header checks. Their declarative
deployment is stored on the target host at
`/opt/omniwa-console/docker-compose.yml`. The pre-promotion Compose files are
retained as `docker-compose.yml.pre-fe4121c-staging` and
`docker-compose.yml.pre-fe4121c-production` for scoped rollback.

An authenticated browser audit against each official API origin also verified:

- the expected Staging or Production environment badge and API origin;
- all three required capabilities were discovered;
- instance list/detail reads used credential-free `/instance/metadata`;
- Credential Health rendered key version 1, zero fallback lookups, and the
  explicit zero-workload warning instead of a removal-safety verdict;
- the admin key was absent from browser storage, URLs, console output, request
  URLs, analytics, and error reporting; and
- reload and sign-out cleared the in-memory credential.

CI published the artifact only after its image smoke job passed and attached
SBOM and provenance attestations. The public Staging and Production Console
deployments are complete, but Development remains on the earlier release.
This record does not start an approved quiet window or authorize C4.

## Observation baseline

The first 2026-07-23 development smoke check, before HMAC configuration, found:

- `instance_metadata_views=true` and credential-free metadata returned HTTP 200;
- metadata contained no `token`, `proxy`, or QR material;
- `instance_token_rotation=false`;
- `instance_credential_health=false`, with HTTP 503 `capability_unavailable`;
- HMAC-backed credential migration was therefore not observable.

This is evidence that C3 has **not started**, not evidence that plaintext
removal is safe.

After enabling the HMAC configuration, startup backfill brought two rows to the
current digest. One deliberate authentication against the remaining legacy key
version exercised self-healing at 2026-07-23 01:39:52 UTC. This was before the
Console deployment above and produced the current cumulative fallback count of
one. The resulting baseline is three of three instances on key version 1, with
zero plaintext-only rows and zero rows on another key version.

## C3 observation log

Record each sample with its immutable Console release. Any plaintext fallback
first observed after deployment restarts the eventual approved quiet window.

| Sample at (UTC) | Environment | Total | Current digest | Plaintext only | Other key version | Fallback lookups | Last fallback at | Backend health | Evidence link |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| 2026-07-23 01:48:13 | Development | 3 | 3 | 0 | 0 | 1 | 2026-07-23 01:39:52 | API and throttling healthy; all three instances disconnected; one fixture projection degraded by existing dead letters | Superseded local-artifact baseline |
| 2026-07-23 02:08:35 | Development | 3 | 3 | 0 | 0 | 1 | 2026-07-23 01:39:52 | API and throttling healthy; all three instances disconnected; one fixture projection degraded by existing dead letters | Authenticated sample after registry-digest deployment |
| Pending | Development | — | — | — | — | — | — | — | Next quiet-window sample |
| 2026-07-23 07:18:16 | Staging | 0 | 0 | 0 | 0 | 0 | Never observed | API healthy; projection not started with zero resources; no instances | Authenticated browser sample after PR #32 promotion |
| 2026-07-23 07:18:16 | Production | 0 | 0 | 0 | 0 | 0 | Never observed | API healthy; projection not started with zero resources; no instances | Authenticated browser sample after PR #32 promotion |

The Staging and Production samples confirm the deployed integration path, not
credential adoption: both official backends still contain zero instances.
Their `0/0` results are not representative workload evidence and must not be
used to infer `safeToRemove` or to start the quiet-window clock.

## Recovery exercises

Development recovery checks were repeated at 2026-07-23 02:08 UTC after the
registry-digest deployment:

- A disposable instance authenticated successfully before rotation. Rotation
  advanced its credential generation from 1 to 2; the old token then returned
  HTTP 401, the new token returned HTTP 200, and a stale-generation retry
  returned HTTP 409. The fixture was deleted after the drill.
- A full `omniwa_users` logical backup restored into an isolated temporary
  database. Source and restore matched at 3 instances, 20 schema migrations,
  and 3 current token digests. The temporary database was dropped after the
  comparison.
- `/server/ok`, `/server/health`, `/server/projection-health`, and
  `/instance/credential-health` returned HTTP 200. Health distinguishes API,
  instance connection, projection, and throttling state; the existing
  projection dead letters remain a separate remediation item.

Staging and Production also passed isolated disposable-fixture rotation drills:
create and rotate returned HTTP 200, the prior token returned HTTP 401, the
replacement token returned HTTP 200, and a stale-generation attempt returned
HTTP 409. The fixtures were deleted afterward. Logical backups of both users
and auth databases restored successfully into isolated databases; source and
restore matched at zero instances, 20 schema migrations, zero current digests,
and one auth-schema table. Backup artifacts are root-only (`0600`) on the
deployment host.

These exercises establish recovery mechanics but do not start or complete the
final quiet window. The proposed 14-day duration, representative workload,
and five named owner approvals remain pending.

The development fallback was last observed before its deployment baseline.
Any later fallback restarts the eventual clock. No environment's quiet-window
clock is active until the duration, representative workload, and owner scope
are explicitly approved.

Required final conditions throughout the approved final window:

- `currentDigest == total`;
- `plaintextOnly == 0`;
- `otherKeyVersion == 0`;
- no unexplained fallback after the C2 deployment timestamp;
- backup/restore and token-rotation recovery exercises passed;
- API, instance, projection, and throttling health remained independently
  observable.

## Explicit approvals

| Owner | Name | Decision | Timestamp (UTC) | Evidence or conditions |
| --- | --- | --- | --- | --- |
| Product owner | Pending | Not approved | Pending | Pending |
| Console owner | Pending | Not approved | Pending | Pending |
| Backend owner | Pending | Not approved | Pending | Pending |
| Security owner | Pending | Not approved | Pending | Pending |
| Operations owner | Pending | Not approved | Pending | Pending |

Only after all five approvals may C4 use separate, reversible-first backend
PRs to stop ordinary plaintext response exposure, observe the deployed estate,
and later remove plaintext storage with its own backup and rollback checkpoint.

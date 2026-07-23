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
| Staging | Pending | Pending | Pending | Pending | No |
| Production | Pending | Pending | Pending | Pending | No |

The development container is pinned directly to the multi-platform registry
digest, reports OCI revision `ba2f2cd08fc3763489fdd1c46ffb183ec0aeec80`, runs
as UID 101, and passed `/healthz`, `/events` deep-link, SPA fallback, and
Content-Security-Policy checks. CI published the artifact only after its image
smoke job passed and attached SBOM and provenance attestations. Staging and
production remain blocked until their environment owners and targets are
available.

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

Record every sample with the same immutable Console release. Any plaintext
fallback first observed after deployment restarts the approved quiet window.

| Sample at (UTC) | Environment | Total | Current digest | Plaintext only | Other key version | Fallback lookups | Last fallback at | Backend health | Evidence link |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| 2026-07-23 01:48:13 | Development | 3 | 3 | 0 | 0 | 1 | 2026-07-23 01:39:52 | API and throttling healthy; all three instances disconnected; one fixture projection degraded by existing dead letters | Superseded local-artifact baseline |
| 2026-07-23 02:08:35 | Development | 3 | 3 | 0 | 0 | 1 | 2026-07-23 01:39:52 | API and throttling healthy; all three instances disconnected; one fixture projection degraded by existing dead letters | Authenticated sample after registry-digest deployment |
| Pending | Development | — | — | — | — | — | — | — | Next quiet-window sample |

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

These exercises satisfy only the development recovery evidence. They do not
start or complete the final quiet window while staging, production, the
approved duration, and owner approvals remain pending.

The development quiet-window clock may use 2026-07-23 02:07:33 UTC as its
deployment baseline. The cumulative fallback was last observed before that
baseline. Any later fallback restarts the clock; the duration still requires
explicit owner approval.

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

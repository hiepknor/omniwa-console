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
| Development | Pending | Pending | Pending | Pending | No |
| Staging | Pending | Pending | Pending | Pending | No |
| Production | Pending | Pending | Pending | Pending | No |

## Observation baseline

The 2026-07-23 development smoke check found:

- `instance_metadata_views=true` and credential-free metadata returned HTTP 200;
- metadata contained no `token`, `proxy`, or QR material;
- `instance_token_rotation=false`;
- `instance_credential_health=false`, with HTTP 503 `capability_unavailable`;
- HMAC-backed credential migration was therefore not observable.

This is evidence that C3 has **not started**, not evidence that plaintext
removal is safe.

## C3 observation log

Record every sample with the same immutable Console release. Any plaintext
fallback first observed after deployment restarts the approved quiet window.

| Sample at (UTC) | Environment | Total | Current digest | Plaintext only | Other key version | Fallback lookups | Last fallback at | Backend health | Evidence link |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| Pending | Pending | — | — | — | — | — | — | — | Pending |

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

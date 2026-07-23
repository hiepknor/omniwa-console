# UI v2 rollout evidence

This record controls promotion of the generation-isolated v2 Console artifact.
It does not approve Production, start the credential quiet window, or authorize
legacy deletion. Promotion gates and rollback rules are defined in
[DEPLOYMENT.md](DEPLOYMENT.md).

## Candidate artifact

| Evidence | Value |
| --- | --- |
| Merge | `b6c6ba3a71c3b07a2760e0f3ac52f68800424cff` (PR #51) |
| V2 digest | `ghcr.io/hiepknor/omniwa-console@sha256:0897f074fdf04fdff9fe396d6749ca9a9c641510ab35d96123e989d26d837abb` |
| OCI version | `sha-b6c6ba3a71c3b07a2760e0f3ac52f68800424cff` |
| Generation label | `cc.onio.console.ui-generation=v2` |
| Runtime user | UID 101 |
| CI | Legacy/v2 image smoke and immutable publish succeeded in run `30017043601` |

## Environment state

| Environment | Console origin | API origin | Artifact | State |
| --- | --- | --- | --- | --- |
| Staging | `https://staging-console.onio.cc` | `https://staging-api.onio.cc` | Candidate v2 digest above | Promoted 2026-07-23 14:51:17 UTC; rollback drill passed and same digest re-promoted 14:55:57 UTC |
| Production | `https://console.onio.cc` | `https://api.onio.cc` | Legacy digest `sha256:163f068e5acb6b60f59cd7a27b8d14d21ba0a2d04d02ce7f2cf3b804b6da5f59`, revision `fe4121cf87b8d4690bb087a87d858efdbcb49841` | Healthy; intentionally unchanged |

The two Console containers and two API containers remain separate services and
loopback ports behind Caddy. The Staging compose file has exactly one v2 digest;
the Production service remains pinned to its previous legacy digest.

## Completed Staging evidence

- Container health is healthy, UID is 101, and revision/generation labels match
  the candidate digest.
- `/healthz`, `/`, `/connect`, `/overview`, `/instances`, `/events`, and
  `/recovery` return HTTP 200 through the public Staging origin, including SPA
  deep-link fallback.
- The entry document is `no-store` and returns Content-Security-Policy,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and
  `Referrer-Policy: no-referrer`.
- The Staging API preflight accepts `apikey` from the Staging Console origin.
- With the root-only Staging admin key used only on the host,
  `/server/capabilities`, `/instance/metadata`,
  `/instance/credential-health`, and `/server/health` returned HTTP 200. No key
  value was printed, copied, persisted in Console, or recorded here.
- Credential Health reported key version 1, 0 instances, 0 plaintext fallback
  lookups, and 0 affected instances. API health was healthy.
- A rollback drill recreated only Staging on legacy revision `fe4121c`, verified
  health and `/connect`, then re-promoted the exact candidate digest and verified
  `/healthz`, `/connect`, and `/events`. The Production container ID did not
  change during the drill.

## Evidence still required

Staging currently has no instance or representative integration. Therefore 0/0
is not an authoritative workload baseline and does not satisfy route or C3
observation gates. Before Production approval, an authorized operator must
record:

- onboarding of representative instance/integration workloads and responsible
  owners for admin keys and instance tokens;
- authenticated browser review of environment/scope badges, all advertised
  capabilities, memory-only reload/sign-out behavior, and absence of secrets in
  storage, URL, logs, analytics, and error reports;
- ready non-empty and authoritative empty projections plus syncing, stale,
  not-ready, normalized failure, and rate-limit behavior;
- destructive commands, uncertain mutations, one-time token handling, and
  narrow post-acknowledgement refresh;
- keyboard and 360/768/1024/1440 responsive evidence for every route;
- the approved credential quiet-window duration and recurring health samples.

## Rollback target

The Staging pre-promotion compose file is retained at
`/opt/omniwa-console/docker-compose.yml.pre-b6c6ba3-staging`. It pins both
services to legacy digest
`sha256:163f068e5acb6b60f59cd7a27b8d14d21ba0a2d04d02ce7f2cf3b804b6da5f59`.
Rollback must restore only the Staging service, recreate it, and verify health,
direct routes, revision, and generation before deciding whether to re-promote.
The pre-drill candidate config is also retained as
`docker-compose.yml.pre-b6c6ba3-rollback-drill`.

## Production approvals

| Owner | Name | Decision | Timestamp (UTC) | Evidence or conditions |
| --- | --- | --- | --- | --- |
| Product | Pending | Not approved | Pending | Representative workflows and acceptance evidence pending |
| Console | Pending | Not approved | Pending | Authenticated route, responsive, and accessibility audit pending |
| Backend | Pending | Not approved | Pending | Representative instance/projection evidence pending |
| Security | Pending | Not approved | Pending | Secret-boundary and destructive/one-time-secret exercises pending |
| Operations | Pending | Not approved | Pending | Ongoing monitoring and representative workload evidence pending |

Production remains on legacy until every row is approved. Legacy source and the
generation switch remain required rollback assets until Production v2 is
verified after cutover.

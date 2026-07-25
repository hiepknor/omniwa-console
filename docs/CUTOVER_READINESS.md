# V2 Cutover Readiness

This is a decision-support status overlay for retiring the legacy generation. It
maps the promotion gates — defined in [DEPLOYMENT.md](DEPLOYMENT.md) and
[REDESIGN_BRIEF.md](REDESIGN_BRIEF.md) — to their current state and points at
where the authoritative evidence is recorded. It does not redefine the gates,
grant approvals, or substitute for the immutable-artifact evidence in
[UI_V2_ROLLOUT_EVIDENCE.md](UI_V2_ROLLOUT_EVIDENCE.md) and
[CREDENTIAL_ROLLOUT_EVIDENCE.md](CREDENTIAL_ROLLOUT_EVIDENCE.md).

**Status:** not ready. Production runs the legacy generation; the promotion
gates are open and no cutover approval is recorded. Legacy retirement (Track B
in [LEGACY_RETIREMENT_PLAN.md](LEGACY_RETIREMENT_PLAN.md)) remains blocked.

## Gate status

Status legend: **Met** — evidence recorded on the promoted artifact;
**Partial (dev)** — exercised only against a local development build and dev
fixtures, which does not satisfy the gate; **Open** — not started;
**Governance** — an owner decision, not an engineering task.

| Promotion gate (DEPLOYMENT.md) | Status | Notes |
| --- | --- | --- |
| 1. Representative non-empty workloads and authoritative empty results | Open | Staging has 0 instances / 0/0 credential-health, which the evidence record already flags as non-representative. Requires onboarding representative instance/integration workloads. |
| 2. Stale, syncing, not-ready, normalized-failure, rate-limit exercises | Partial (dev) | Ready / stale / failed / not-started projection states and authoritative-empty lists were observed on a local dev build; normalized-failure and rate-limit exercises and Staging/Prod capture remain open. |
| 3. Destructive-command, uncertain-command, one-time-secret exercises | Open | Not exercised (no mutations were run against the backend). |
| 4. Keyboard and 360/768/1024/1440 responsive evidence for every route | Open | Not captured. |
| 5. Immutable revision, digest, generation label, health, deep-link, rollback verification | Partial | Staging deploy/rollback smoke and labels/digest are recorded for the v2 candidate in UI_V2_ROLLOUT_EVIDENCE.md; Production remains on the reviewed legacy digest. |
| 6. Named Product, Console, Backend, Security, Operations approvals | Governance | All five pending. |

The credential C3 quiet window and its five approvals are tracked separately in
CREDENTIAL_ROLLOUT_EVIDENCE.md and are also incomplete.

## Development runtime verification (informational)

On 2026-07-25 the v2 build on `main` was driven end-to-end against a **local
development** OmniWA GO backend (dev fixtures), in both instance and admin
credential scope. This is engineering confidence for the shared-component
refactors, **not** cutover evidence: it used a local dev build and dev data, not
the immutable Staging or Production digest, and no authorized operator recorded
it against an official origin.

Observed, with no console errors across every route:

- environment and credential-scope badges and advertised-capability gating were
  correct in both scopes; a reload cleared the in-memory session;
- projection states rendered from real data: ready, stale, failed, not-started,
  and authoritative-empty lists;
- the shared list, table, select, pagination, page-guard, relative-time, and
  row-selection primitives rendered and behaved correctly with real records.

Not covered by that pass: destructive/uncertain/one-time-secret mutation flows,
rate-limit behavior, and responsive/keyboard evidence.

## To unlock legacy retirement (Track B)

1. Onboard representative instance/integration workloads on Staging (gate 1) and
   capture gates 2–5 against the promoted immutable v2 digest through an
   authorized operator, recording them in UI_V2_ROLLOUT_EVIDENCE.md.
2. Complete the credential C3 quiet window in CREDENTIAL_ROLLOUT_EVIDENCE.md.
3. Record the five named approvals (gate 6).

Only then may Track B execute — retire the generation switch, delete the legacy
code, adopt canonical names, and close out the docs — in the order set by
[LEGACY_RETIREMENT_PLAN.md](LEGACY_RETIREMENT_PLAN.md).

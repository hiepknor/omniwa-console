# Engineering Delivery Workflow

This is the canonical delivery process for every goal, feature, fix,
refactor, documentation change, and operational follow-up in
`omniwa-console`. It is designed to keep the browser client synchronized with
the public OmniWA GO contract, make review evidence reproducible, and prevent
unsafe or unrelated changes from entering a pull request.

`AGENTS.md` contains the mandatory repository rules. This document explains
how to apply them from intake through merge and post-merge verification.

## Core principles

1. **Contract before UI.** Confirm the public REST behavior before designing a
   client abstraction or panel state. Never infer backend behavior from a mock,
   generated type, empty array, or provider-specific knowledge alone.
2. **One outcome, one branch, one pull request.** Keep changes independently
   reviewable and reversible. Do not mix cleanup or opportunistic refactors
   into a product task.
3. **Evidence before confidence.** A task is complete only when its automated
   and manual evidence matches its risk. Compilation alone is not verification.
4. **Safe states are product behavior.** Loading, empty, stale, syncing,
   unavailable, rate-limited, and error states are part of the implementation,
   not follow-up polish.
5. **Server authority is preserved.** The Console presents server state and
   submits commands. It does not recreate backend orchestration, authorization,
   pagination, retries, or business rules in the browser.
6. **Review the delivered diff.** Self-review compares the branch with its base,
   not merely the files remembered by the implementer.

## 1. Classify the request and authority

Before changing files, classify the work:

| Request | Default action |
| --- | --- |
| Explain, investigate, review, or report | Read-only inspection and an evidence-backed response |
| Diagnose | Identify the cause and impact; do not implement unless requested |
| Feature, fix, refactor, or documentation change | Run the complete branch-to-PR workflow |
| Contract update | Verify backend source, sync the vendored contract, regenerate, then adapt consumers |
| Merge or release | Perform only when the user explicitly authorizes it |

Write down the intended outcome, non-goals, affected user journey, and
acceptance criteria. If the request is ambiguous but a narrow reversible
interpretation is safe, state the assumption and proceed. Stop for direction
when alternatives materially change product behavior, data safety, public
contract ownership, or external systems.

## 2. Preflight the repository

Before implementation:

1. Read `README.md`, `AGENTS.md`, and the task-specific documents in `docs/`.
2. Check `git status --short`. Preserve all unrelated user changes.
3. Fetch `origin` and create a new branch from the latest `origin/main`:

   ```bash
   git fetch origin
   git switch -c feat/<slug> origin/main
   ```

   Use `fix/<slug>` for defects and `docs/<slug>` for documentation-only work.
4. Confirm no open pull request already owns the same outcome. Reuse an open
   task branch only when the user asks to continue that exact task.
5. If the work depends on an unmerged pull request, prefer waiting for that PR
   to merge. If parallel delivery is necessary, create an explicitly documented
   stacked PR against the dependency branch; rebase it onto `main` after the
   dependency merges.

Never start from a stale local `main`, commit directly to `main`, or silently
include existing workspace changes.

## 3. Establish current behavior

Inspect before designing:

- Trace the route, feature hooks, `src/api/` module, query keys, shared
  components, and relevant tests end to end.
- Read `docs/PANELS.md` for operation ownership and `docs/API_CLIENT.md` for
  envelope, cursor, error, and command semantics.
- Search for existing primitives before adding another table, drawer, dialog,
  notice, timer, cache, formatter, or API adapter.
- For a bug, reproduce it or establish a deterministic failing condition. Record
  expected versus actual behavior and the smallest known trigger.
- For UI work, identify keyboard, narrow viewport, loading, empty, stale, and
  failure behavior before editing markup.

Do not treat old documentation as unquestionable. When code, vendored contract,
backend source, and docs disagree, identify the authoritative source and include
the documentation correction in scope.

## 4. Resolve contract and ownership impact

For every networked change, answer these questions before implementation:

1. Which `METHOD /path` operations are required, and which panel owns them?
2. Which credential scope is required: admin key or instance token?
3. Is the response raw, enveloped, projection-backed, paginated, stale-capable,
   and which HTTP success status acknowledges it?
4. Which machine-readable errors and HTTP headers affect UI behavior?
5. Is the cursor opaque and bound to an instance or filter?
6. Is the action a read or mutation, and is retry safe?
7. Which capability gates readiness? An empty result never proves readiness.

If the public contract is missing or unsafe, stop frontend implementation and
record a backend requirement. Do not work around it with direct database access,
private backend imports, provider calls, client-side orchestration, cursor
construction, or aggressive live polling.

When the backend contract changed, the orchestrator performs:

```bash
pnpm contract:sync
pnpm api:generate
```

Commit the vendored contract and generated schema together. Generated code is
reviewed for unexpected surface changes but never edited manually.

## 5. Assess risk and choose verification depth

Classify the highest risk present in the task:

| Risk | Examples | Required evidence |
| --- | --- | --- |
| Low | Copy, isolated docs, non-behavioral styling | Diff review, `pnpm test`, `pnpm check` |
| Medium | Query hook, URL state, list/detail UI, shared presentational component | Unit tests, affected-state review, `pnpm test`, `pnpm check` |
| High | Auth/session, generated contract, shared API/error/cache layer, mutation, destructive action, campaign/send flow | Contract/source verification, focused regression tests, full test/check suite, explicit manual scenario review and rollback note |

Risk is cumulative. A small diff in a shared API helper is high-risk because its
blast radius is large. Security, credential exposure, message sending, duplicate
mutation, destructive operations, and incorrect empty-state interpretation are
always high-risk.

## 6. Plan a vertical slice

Produce a short implementation plan before editing. Each step should result in
an observable, testable state. A typical slice is:

1. API types and envelope/error normalization.
2. Query keys and TanStack Query hooks.
3. Capability/readiness gates.
4. Panel loading, empty, ready, stale, unavailable, and error states.
5. Mutations, confirmation, server acknowledgement, and narrow invalidation.
6. Focused tests and documentation.

Keep at most one conceptual step in progress. Update the plan when evidence
changes the approach. A plan is not permission to broaden scope.

## 7. Implement within repository boundaries

During implementation:

- Keep all HTTP access in `src/api/`; features consume typed functions/hooks.
- Keep server state in TanStack Query and use canonical query keys.
- Keep filters, cursors, selected resources, and panel modes in URL search
  params when they define a shareable operator context.
- Treat cursors as opaque. Reset them when their instance or filter scope
  changes.
- Preserve projection metadata. Distinguish truly empty `ready` data from
  `syncing`, `stale`, `not_started`, `failed`, and `projection_not_ready`.
- Never call WhatsApp live as a fallback for an unavailable projection.
- Prefer `Retry-After` over the response body for rate limits. Do not retry a
  mutation automatically or turn a known 429 into a generic failure.
- Wait for mutation acknowledgement, then invalidate or refresh the narrowest
  affected projection. Avoid optimistic updates for lifecycle, destructive,
  invite-link reset, send, and campaign state.
- Reuse shared table, drawer, dialog, feedback, and projection-state
  primitives. Features never import other features.
- Never log, render, persist in query keys, or commit API keys, instance tokens,
  or raw provider payloads. Render identifiers only when the public contract
  supplies them and the operator workflow requires them; never reconstruct data
  that the backend normalized or redacted.

Keep commits coherent. Do not reformat unrelated files or hide behavior changes
inside generated or mechanical diffs.

## 8. Verify continuously

Run the fastest relevant checks while implementing, then the complete gates
before delivery.

Minimum final automation for any file-changing task:

```bash
git diff --check
pnpm test
pnpm check
```

Also verify behavior proportional to risk:

- **Lists:** loading, ready with data, genuinely empty, initial error, stale
  refresh error, unavailable/not-ready, pagination, and filter reset.
- **Mutations:** disabled/pending state, acknowledgement wording, failure,
  duplicate-submit prevention, invalid transition, and targeted refresh.
- **Rate limits:** header precedence, body fallback, countdown end, no automatic
  mutation retry, and no duplicate scheduled retry.
- **Routing:** direct deep link, back/forward navigation, refresh persistence,
  and instance/filter changes.
- **Responsive UI:** keyboard flow, focus restoration, narrow viewport,
  truncation, and accessible status text.
- **Contract changes:** generated-schema freshness, operation ownership, legacy
  response exceptions, and forward-compatible unknown fields.

If a required check cannot run, do not describe the task as fully verified.
State exactly what is missing, why, and the remaining risk.

## 9. Self-review before commit

Review `git diff origin/main...HEAD`, `git diff`, `git diff --cached`, and
`git status --short` as if reviewing someone else's pull request. Check in this
order:

1. Correctness against acceptance criteria and the backend contract.
2. Data loss, duplicate mutation, credential, authorization, and privacy risk.
3. Empty/stale/not-ready and error semantics.
4. Query-key scope, invalidation, polling, retry, timer cleanup, and races.
5. Architecture and panel-operation ownership.
6. Accessibility, responsive behavior, and deep links.
7. Test quality: tests must fail for the defect or missing behavior, not merely
   execute the new code.
8. Documentation accuracy and absence of scope claims not implemented yet.
9. Diff hygiene: no unrelated files, secrets, debug output, or manual generated
   edits.

Resolve all blocking findings before pushing. Record legitimate follow-ups in
the PR rather than silently expanding the current task.

## 10. Commit and open the pull request

Commit only task-owned files with an outcome-oriented message. Push the branch
and open a PR against `main`.

Every PR description contains:

- **Summary:** user-visible and architectural outcome.
- **Why:** defect, goal, or contract change being addressed.
- **Contract/docs impact:** operations, capabilities, generated files, and
  `docs/PANELS.md` changes, or explicitly “none”.
- **Verification:** exact commands and manual scenarios completed.
- **Risk and rollback:** important residual risk and the simplest safe revert.
- **Follow-ups:** deliberately deferred work, without claiming it is complete.

Before handoff, verify that the PR is open, targets the intended base, is
mergeable, contains the expected commits, and the local worktree is clean. Do
not merge without explicit user authorization.

## 11. Merge and post-merge

When the user authorizes merge:

1. Re-read the PR state and required checks; do not merge a stale, conflicted,
   draft, or failing PR.
2. Use the repository's normal merge strategy and delete the feature branch.
3. Switch to `main` and fast-forward from `origin/main`.
4. Confirm the PR is merged, record the merge commit, and confirm a clean
   worktree.
5. For high-risk changes, verify the deployed/static artifact through the
   available release process and watch for authentication, API error, rate-limit,
   and mutation regressions. If no deployment access exists, state that clearly.

Rollback defaults to reverting the merge commit with a new PR. Never rewrite
shared history or use destructive workspace commands to simulate rollback.

## Definition of done

A task is done only when all applicable statements are true:

- The requested outcome and acceptance criteria are satisfied without hidden
  scope expansion.
- Public API behavior, capability gates, and panel ownership are synchronized.
- Loading, empty, ready, stale/syncing/not-ready, and error states are handled.
- Mutations are confirmed, duplicate-safe, non-optimistic where required, and
  invalidate the correct projection.
- Focused regression tests exist and `git diff --check`, `pnpm test`, and
  `pnpm check` pass.
- The delivered diff has been self-reviewed and contains no boundary violation,
  credential, debug artifact, unrelated change, or manual generated edit.
- Documentation matches implemented behavior.
- A dedicated PR targets the correct base and accurately reports verification,
  risk, rollback, and follow-ups.
- Merge occurs only after explicit authorization; post-merge state is verified.

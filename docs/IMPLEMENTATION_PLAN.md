# OmniWA GO Integration Plan

This roadmap replaces the historical pre-migration milestones. Backend G0–G6 is
available at OmniWA GO commit `7f9e6ac`; the remaining work is frontend
integration in small, independently reviewable pull requests.

Each phase must satisfy `docs/DELIVERY_WORKFLOW.md` and keep
`docs/PANELS.md` synchronized with operations actually consumed.

## Current baseline

Completed:

- OmniWA GO contract sync and generated TypeScript schema.
- Runtime `apikey` session model with admin and instance-token clients.
- Instance lifecycle, QR, status, logout, and advanced settings.
- Groups projection list/info/search, freshness, opaque cursor, and mutation UI.
- Contacts projection directory with server prefix search, opaque cursor, and
  normalized detail views.
- Labels projection directory with legacy bare-list compatibility and
  freshness-aware detail views.
- Chats projection list/detail with stable keyset pagination and explicit
  backend-owned fields.
- Messages projection history/detail, per-recipient receipts, and text send
  acknowledgement with independent delivery state.
- Global capability provider and reusable instance capability hook.
- Projection envelope metadata adapter and shared projection notice.
- Machine-readable error adapter, `Retry-After` countdown, jittered manual retry,
  duplicate scheduling protection, and no automatic mutation retry.

Not yet integrated:

- media send and additional chat/message action commands;
- durable Events;
- Overview, split Health, and Projection Health;
- Campaign UI;
- removal of remaining legacy polling/stub assumptions.

## Phase 1 — Groups projection (implemented)

Goal: make Groups the first complete projection consumer.

- Call instance-scoped capabilities when the selected instance changes.
- Use `groups_projection` as the initial-readiness signal without interpreting
  an empty list as readiness or hiding an existing stale snapshot.
- Adapt `/group/list` and `/group/info` with projection metadata.
- Move search to `GET /group/search` with prefix query, limit, and opaque cursor.
- Reset cursor when instance or query changes; keep scope in the URL.
- Render ready-empty, syncing, stale, failed, and 503 not-ready distinctly.
- Keep invite-link reads projection/cache-backed; reset remains a confirmed
  mutation followed by projection refresh.
- Remove comments and polling behavior that describe group reads as live
  WhatsApp queries.

Exit achieved: Groups performs no live-read fallback, scopes cache keys by
instance, preserves projection freshness, and uses server prefix search with
opaque cursor pagination. Adapter and shared projection-state tests cover the
contract boundary.

## Phase 2 — Contacts and Labels

Goal: supply directory context for the Chats workspace.

Contacts and Labels slices implemented: the Chats workspace now uses
instance-scoped projection list/search/detail reads, keeps directory scope in
the URL, and exposes explicit normalized models. The Labels adapter preserves
the documented bare-array list while detail reads retain freshness metadata.

- Gate contacts and labels independently.
- Implement contacts list, prefix search, detail, and opaque cursor behavior.
- Preserve normalized/redacted identity output exactly as returned.
- Handle `/user/check` complete stale-cache metadata without accepting partial
  results.
- Keep `/label/list` on its documented legacy bare-array adapter.
- Integrate label detail and projected associations needed by Chats.

Exit achieved: contact and label reads are capability-gated, authoritative, and
deep-linkable; no browser identity cache or provider-payload reconstruction
exists. Label associations remain owned by the upcoming Chat/Message resources
rather than a Console-invented endpoint.

## Phase 3 — Chats, Messages, and delivery

Goal: replace the Chats workspace stubs with persisted projections.

Chats slice implemented: list/detail reads are instance-token scoped,
capability-gated, and normalized from the OmniWA GO projection contract. The
workspace keeps stale snapshots visible, recovers invalid accumulated cursors
by resetting to the first page.

Messages slice implemented: history/detail/receipt reads are chat- and
instance-scoped, independently capability-gated, and retain normalized content,
media metadata, lifecycle, provenance, and retention fields. Text send uses the
existing action endpoint and invalidates only the affected Chat/Message keys;
its acknowledgement is never rendered as delivery. Unsupported retry, cancel,
reconnect, and media controls are not exposed. An uncertain send failure has no
one-click retry because the current endpoint has no Console-owned idempotency
contract.

- Implement chat list/detail and keyset pagination.
- Implement message list/detail and delivery/read receipt history.
- Preserve message direction, sender/recipient, content summary, media metadata,
  provenance, lifecycle, and retention state.
- Keep media binary outside the projection cache.
- Wire text send through the existing public command, then refresh the affected
  Chat/Message projections. Integrate media only after its backend request and
  storage-reference contract is verified independently.
- Never interpret send acknowledgement as `sent`, `delivered`, or `read`.
- Consume label associations only when OmniWA GO adds them to the public
  Chat/Message DTO; do not reconstruct persisted associations in the browser.
- Verify new messages do not shift already-loaded cursor pages.

Exit status: persisted browsing, receipt inspection, and text send are achieved
without client-side message accumulation. Media/action ownership remains a
separate slice and is not represented by placeholders.

## Phase 4 — Durable Events, Overview, and Health

Goal: replace operations stubs and weak liveness assumptions.

- Implement `/events` exact-type filter and opaque cursor history.
- Use durable history for event audit and future reconnect recovery.
- Implement `/server/overview` with URL-backed window, capped at 720h.
- Render generated/window timestamps and projection-derived counts.
- Implement split `/server/health` and `/server/projection-health` views.
- Show circuit-breaker `openUntil` and `retryAfterSeconds` without probing.
- Remove any use of `/server/ok` as connection/readiness state.

Exit: operators can distinguish API health, instance connection, projection
freshness, and rate-limit posture.

## Phase 5 — Campaign orchestration

Goal: provide consent-aware campaign creation and monitoring without moving
worker logic into the browser.

- Gate with `campaign_orchestration` and `outbound_rate_limit`.
- Build `/messages` campaign list/detail with status and opaque cursor.
- Build `/messages/new` creation flow requiring opt-in evidence per recipient.
- Never persist or echo the raw evidence reference after submission.
- Implement schedule/start/pause/resume/abort with server-confirmed transitions.
- Add recipient and audit pagination and preserve all recipient states.
- Explain that leased work may finish after pause.
- Handle HTTP 409 transitions and outbound 429 without automatic mutation retry.

Exit: campaigns can be created, controlled, and audited entirely through
OmniWA GO. See `docs/CAMPAIGNS.md`.

## Phase 6 — Polling and integration hardening

Goal: remove migration scaffolding and prove production safety.

- Remove obsolete legacy adapters, copy, and operation assumptions.
- Audit every query interval; projection polling is bounded and unsupported/live
  reads do not poll.
- Audit query-key scope, cursor reset, stale snapshot preservation, and mutation
  invalidation across all integrated panels.
- Complete keyboard, focus, responsive, deep-link, and bundle verification.
- Add a browser-safe realtime bridge only if a separately authorized backend/BFF
  exists; otherwise retain REST + durable Events posture.
- Keep unsupported Queue/Webhooks/Global Settings/Admin Keys routes explicit.

Exit: docs, panel ownership, code, generated contract, and navigation describe
the same shipped product.

## Phase sequencing

```text
Foundation (done)
  → Groups
  → Contacts + Labels
  → Chats + Messages
  → Events + Overview + Health
  → Campaigns
  → Hardening
```

Groups comes first because it exercises every shared projection concern with a
small existing panel. Campaigns come after message/delivery visibility so the
console can observe outcomes rather than merely submit work.

## Verification for every phase

Minimum automation:

```bash
git diff --check
pnpm test
pnpm check
```

Each phase also verifies capability changes, ready-empty versus not-ready,
stale-data preservation, cursor scope/reset, rate-limit behavior, duplicate
mutation prevention, direct deep links, keyboard flow, and narrow viewport
layout where applicable.

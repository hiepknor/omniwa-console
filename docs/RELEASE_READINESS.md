# Release Readiness Evidence

This record captures the 2026-07-26 production-readiness audit of the current
Console candidate. It separates reproducible local/CI evidence from live
authenticated environment evidence; passing the former does not authorize a
production promotion without the latter.

**Status: conditionally ready; authenticated staging acceptance remains required.**

## Findings resolved

| Finding | Resolution | Regression evidence |
| --- | --- | --- |
| Compatibility OmniWA GO servers could not open the fleet panel even though credential-stripping adapters existed. | Capability discovery now selects metadata views when advertised and the compatibility adapter otherwise; no fleet read starts before discovery succeeds. | `fleet-readiness.test.ts`, `instances.test.ts`, credential gate |
| Group detail disappeared when `groups_projection` temporarily vanished. | Cached detail remains visible while all provider commands are disabled until capability readiness returns. | `GroupWorkspace.test.tsx` |
| Group sends did not refresh projected conversation history. | Acknowledged group sends invalidate the chat directory and only that group's message pages. | `cache.test.ts`, query-key tests |
| Chat-directory invalidation also matched every message-history cache. | Message history moved from the `chats` directory namespace to the singular `chat` resource namespace. | `keys.test.ts`, `cache.test.ts` |
| Token rotation could refetch status/settings with the replaced token. | Token-authenticated capability, status, QR, and settings entries are removed before installing a replacement credential. | `credential-cache.test.ts` |
| Backend correlation IDs were discarded. | `ApiFailure` now prefers `X-Request-ID`, falls back to body `requestId`, and every error detail includes its code/category. | `envelopes.test.ts`, `connect-flow.test.ts` |
| Rate-limited feature errors did not consistently expose cooldown timing or suppress retry. | A shared failure notice now shows the countdown, disables automatic retry, and permits one jittered manual retry after cooldown. | `ApiFailureNotice.test.tsx`, rate-limit contract |
| Connect step numbers failed AA contrast at 2.92:1. | Removed the opacity reduction and added a design gate. | Chrome Lighthouse accessibility 100 |
| A private SPA fallback produced an invalid crawler response. | Added no-index metadata and a `robots.txt` that disallows crawling. | Production build artifact inspection |

## Verified evidence

- Backend reachability: `localhost:4000` returned an authenticated-boundary 401
  and exposed `X-Request-ID`; no credential was extracted from the environment.
- Invalid-key journey: normalized authentication diagnostic and request ID were
  visible; local/session storage remained empty; the key did not enter the URL.
- Direct unauthenticated deep links returned to `/connect` without retaining the
  attempted filter, cursor, or identifier as credential state.
- Responsive sweep at 390×844, 768×900, and 1280×900 covered `/connect`,
  `/__ui`, Instances, Groups, and Conversations deterministic fixtures. No page
  overflow, clipped control label, or unnamed disabled button was found.
- Chrome Lighthouse on `/connect`: Accessibility 100 and Best Practices 100.
- The locally built `dist/` ran under the production nginx base as UID 101.
  `/healthz` and `/connect`, `/overview`, `/instances`, `/recovery`, `/chats`,
  `/groups`, `/messages`, and `/events` all returned HTTP 200 with SPA fallback.
  CSP, frame denial, no-sniff, referrer, permissions, and no-store headers were
  present.
- The previous `main` image workflow for `460cdf6` completed successfully with
  immutable-image publication. The pull request for this candidate must repeat
  the repository CI image smoke before merge.

## Required live acceptance before promotion

No admin key or representative instance token was supplied to this workspace.
The following evidence is therefore **not verified** and must be completed on a
non-production runtime with representative data before promotion:

1. Admin session: Overview/Health, metadata and compatibility fleet mode as applicable,
   instance detail, credential health, and capability-gated recovery.
2. Instance session: Chats/Messages/Contacts/Labels, Groups, Campaigns, and Events
   across ready, empty, syncing/stale/not-ready, rate-limited, and error states.
3. Commands: pending lock, duplicate-submit prevention, server acknowledgement,
   targeted projection refresh, uncertain-failure handling, and destructive
   confirmation. Use disposable targets; do not exercise destructive commands
   against production data.
4. Reload and sign-out: active and attached credentials disappear, queries clear,
   and deep links return to Connect.
5. Promote the exact CI-produced digest, then repeat `/healthz`, direct-route,
   security-header, revision, and rollback checks through the real reverse proxy.

Production approval remains separate from the credential-migration approvals in
[`CREDENTIAL_ROLLOUT_EVIDENCE.md`](CREDENTIAL_ROLLOUT_EVIDENCE.md).

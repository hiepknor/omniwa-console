# Unsupported Console Surfaces

This file records Console routes that do not have an equivalent public OmniWA
GO management API. It prevents old dashboard-contract assumptions from being
reintroduced as client-side emulation.

| Surface | Current OmniWA GO support | Console behavior |
| --- | --- | --- |
| Queue/jobs administration | Campaign worker state is exposed through campaign recipients/audit, but there is no generic queue/job API | Keep the generic Queue panel unavailable; do not infer worker internals |
| Webhook administration | Instances accept webhook configuration, but there is no public webhook registry/delivery-management API | Keep Webhooks management unavailable |
| Global settings | Per-instance advanced settings exist; no global validate/activate settings API exists | Keep global Settings unavailable; use instance-owned settings only |
| API-key administration | Global key is deployment configuration and instance tokens come from instance creation | Keep Admin Keys unavailable; never emulate rotation in local storage |

Durable Events, Overview/Health, Chats/Messages, Contacts/Labels, Groups, and
Campaigns are supported by the current backend and belong in the integration
roadmap. They are not unsupported merely because their Console panel is still
pending.

When OmniWA GO adds a public endpoint, update the vendored contract and
`docs/PANELS.md` before enabling a surface. Until then, API stubs return a calm
`not_implemented`/unavailable state rather than fake data or direct backend
access.

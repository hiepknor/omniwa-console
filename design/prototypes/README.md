# Prototypes

Static HTML prototypes for every console surface, bound to the brand
contract in [`../DESIGN.md`](../DESIGN.md). Open any file directly in a
browser; sidebar and in-page links navigate between them. Shared styles
live in `console.css`; sample data is fictional and labeled.

These are **markup reference only** — the implemented React panels follow
`docs/ARCHITECTURE.md` and `docs/PANELS.md`, using these files as the
visual spec (structure, spacing, states, status vocabulary).

## Primary workflow (messaging)

| File | Nav item | Shows |
| --- | --- | --- |
| `chats.html` | Chats | Direct conversations only: three-pane workspace, instance selector + label filters, bubble timeline with per-message delivery status, failed-message retry, composer, contact context panel; contact/label lookup via search + filters |
| `groups.html` | Groups | Management table of all groups (metadata, row checkboxes, bulk "Add to Named List" bar) + detail drawer (invite link, members, one-off send) |
| `lists.html` | Groups › Named Lists modal | Named Lists as a modal over Groups: list picker + member groups, add/edit/delete — **proposed contract** |
| `campaigns.html` | Messages | Campaign management: segmented progress bars, running-campaign drawer (counters, recipients, pause/abort) — **proposed contract** |
| `campaign-new.html` | Messages › New | 3-step send-setup wizard at Review: audience, message preview, platform-capped pacing — **proposed contract** |

Campaign/list screens reference operations that do not exist in the v1
contract yet — see [`../../docs/CAMPAIGNS_PROPOSAL.md`](../../docs/CAMPAIGNS_PROPOSAL.md).

## Operations (secondary)

| File | Shows |
| --- | --- |
| `overview.html` | Health strip, metric cards, action-required, live event ticker |
| `instances.html` | Instance table, detail drawer with QR pairing, lifecycle, sessions, capabilities |
| `queue.html` | Queue metric cards, jobs table, dead-lettered job drawer with payload + attempts |
| `webhooks.html` | Webhook table, suspended-webhook drawer with deliveries + single/bulk redrive |
| `events.html` | Live tail table, filters, audit-records tab stub |
| `settings.html` | Active config, draft validate/activate flow, API key table (admin) |
| `dialogs.html` | Compose dialog, typed destroy confirmation, show-once secret, error toast |

# Prototypes

Static HTML prototypes for every console surface, bound to the brand
contract in [`../DESIGN.md`](../DESIGN.md). Open any file directly in a
browser; sidebar and in-page links navigate between them. Shared styles
live in `console.css`; sample data is fictional and labeled.

The navbar-specific Warp token binding and responsive contract are captured
in [`brand-spec.md`](brand-spec.md).

These are **markup reference only** — the implemented React panels follow
`docs/ARCHITECTURE.md` and `docs/PANELS.md`, using these files as the
visual spec (structure, spacing, states, status vocabulary).

## Primary workflow (messaging)

| File | Nav item | Shows |
| --- | --- | --- |
| `chats.html` | Chats | Direct conversations only: three-pane workspace, instance selector + label filters, bubble timeline with per-message delivery status, failed-message retry, composer, contact context panel; contact/label lookup via search + filters |
| `groups.html` | Groups | Management table of all groups (metadata, row checkboxes, bulk "Add to Named List" dropdown) + detail drawer (invite link, members, one-off send) |
| `lists.html` | Historical exploration | Named Lists concept; not present in the OmniWA GO contract and not an implementation target |
| `campaigns.html` | Messages | Campaign management reference: segmented progress, recipient outcomes, audit, and lifecycle controls — **backend ready, console pending** |
| `campaign-new.html` | Messages › New | Creation-flow reference; must be adapted to per-recipient opt-in evidence — **backend ready, console pending** |

Campaign screens are visual references, not contract references. The current
API and required consent flow are documented in
[`../../docs/CAMPAIGNS.md`](../../docs/CAMPAIGNS.md). Named Lists must not be
implemented unless OmniWA GO adds them to its public contract.

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
| `dropdowns.html` | Shared single-select, instance-picker, and quick-action dropdown patterns |
| `tables.html` | Shared responsive table, mobile adaptive-row, filter-sheet, footer, mini-table, and read-state patterns |

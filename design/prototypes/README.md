# Prototypes

Static HTML prototypes for every console panel, bound to the brand contract
in [`../DESIGN.md`](../DESIGN.md). Open any file directly in a browser; the
sidebar and tab links navigate between them. Shared styles live in
`console.css`; sample data is fictional and labeled.

These are **markup reference only** — the implemented React panels follow
`docs/ARCHITECTURE.md` and `docs/PANELS.md`, using these files as the visual
spec (structure, spacing, states, status vocabulary).

| File | Panel(s) in docs/PANELS.md | Shows |
| --- | --- | --- |
| `overview.html` | overview | Health strip, metric cards, action-required, live event ticker |
| `instances.html` | instances | Instance table, filter bar, detail drawer with QR pairing, lifecycle, sessions, capabilities |
| `chats.html` | chats (+ contacts, labels pattern) | Instance-scoped read-only browser: breadcrumb, tab row, search, cursor pagination |
| `groups.html` | groups | Group table, drawer with invite link, member management, group text send |
| `messages.html` | messages | Message history, failed-message drawer with delivery timeline, retry/cancel |
| `queue.html` | queue | Queue metric cards, jobs table, dead-lettered job drawer with payload + attempts |
| `webhooks.html` | webhooks | Webhook table, suspended-webhook drawer with deliveries + single/bulk redrive |
| `events.html` | events | Live tail table, filters, audit-records tab stub |
| `settings.html` | settings + admin-keys | Active config, draft validate/activate flow, API key table (admin) |
| `dialogs.html` | (cross-panel) | Compose dialog, typed destroy confirmation, show-once secret, error toast |

Not prototyped separately: **contacts** and **labels** reuse the `chats.html`
browser pattern with their own columns (noted in the file).

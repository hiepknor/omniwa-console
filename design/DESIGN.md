# OmniWA Console Design System

> Category: Operations & Infrastructure
> WhatsApp platform operations console. Dense, dark-first, emerald accent.

This is the brand contract for `omniwa-console`. Prototypes in
`design/prototypes/` and all implemented panels bind to it. Where this file
is silent, follow the dense-operational defaults of the `frontend-design`
craft rules; where they conflict, this file wins.

## 1. Visual Theme & Atmosphere

OmniWA Console is a **dense operational console**, not a marketing dashboard.
The operator lives here during incidents: scanning instance lifecycles,
tracing a message through queue → provider → delivery, redriving webhook
batches. Everything optimizes for scanability under stress — high information
density, unambiguous status vocabulary, and zero decoration that does not
carry meaning.

The canvas is near-black neutral (`#0b0c0e`) with content surfaces that step
up in luminance rather than casting shadows. Structure comes from
whisper-thin semi-transparent white borders, not from filled boxes. Text is
the primary interface material; color is reserved almost entirely for
**status**. The single brand accent is a desaturated emerald — a deliberate
nod to the WhatsApp domain without cosplaying WhatsApp's UI — and it appears
only on primary actions, active navigation, and the live-connection
indicator.

Identifiers are first-class citizens: instance IDs, request IDs, cursors,
and job IDs always render in monospace with a copy affordance. An operator
should be able to go from any error toast to a log query in one copy-paste.

**Key characteristics:**

- Dark-mode-native: `#0b0c0e` canvas, `#121316` panels, `#1a1c20` elevated surfaces
- Inter for UI text, tabular numerals on all metrics; JetBrains Mono for identifiers and technical values
- Emerald accent (`#10b981`) strictly for actions and "live" affordances — never decoration
- Status is always **dot + label**, never color alone
- Tables at 13px are the workhorse component; cards exist only on Overview
- Borders `rgba(255,255,255,0.06–0.09)`; elevation by luminance stepping, not shadow

## 2. Color Palette & Roles

### Background surfaces

- **Canvas** (`#0b0c0e`): page background.
- **Panel** (`#121316`): sidebar, table containers, cards.
- **Elevated** (`#1a1c20`): dropdowns, drawers, dialogs, row hover.
- **Recessed** (`#08090a`): code/QR wells, input backgrounds.

### Text

- **Primary** (`#f4f5f6`): headings, cell values.
- **Secondary** (`#b6bcc4`): body, descriptions.
- **Muted** (`#7c828c`): metadata, column headers, placeholders.
- **Faint** (`#565b63`): timestamps, disabled, de-emphasized counts.

### Brand & accent

- **Accent** (`#10b981` emerald-500): primary buttons, active nav item, live indicator, links.
- **Accent hover** (`#34d399` emerald-400).
- **Accent pressed/bg** (`#065f46` emerald-800 at 25% opacity for selected rows/pills).

### Status vocabulary (the only other chromatic colors)

| Status | Color | Used for |
| --- | --- | --- |
| `ok / connected / delivered / active` | `#10b981` | Healthy lifecycle states |
| `pending / pairing / queued / accepted` | `#f59e0b` amber-500 | In-flight, waiting states |
| `degraded / retrying / suspended` | `#f97316` orange-500 | Needs attention, self-recovering |
| `failed / disconnected / dead` | `#ef4444` red-500 | Terminal failures, action required |
| `info / streaming` | `#38bdf8` sky-400 | Neutral events, SSE activity |
| `retired / archived / unknown` | `#7c828c` muted | Inactive, no action possible |

Status renders as an 8px dot + 12px label. Color-only signaling is forbidden
(accessibility and print).

### Borders

- **Default** (`rgba(255,255,255,0.07)`): tables, cards, inputs.
- **Subtle** (`rgba(255,255,255,0.05)`): row dividers, section separators.
- **Strong** (`rgba(255,255,255,0.12)`): focused inputs, active drawer edge.

## 3. Typography Rules

### Families

- **UI**: `Inter`, fallback `-apple-system, system-ui, "Segoe UI", Roboto, sans-serif`. Enable `font-feature-settings: "tnum"` wherever numbers align vertically (tables, metrics).
- **Mono**: `"JetBrains Mono"`, fallback `ui-monospace, "SF Mono", Menlo, monospace`. All IDs, cursors, JIDs, payload keys, code.

### Hierarchy

| Role | Size | Weight | Notes |
| --- | --- | --- | --- |
| Page title | 18px | 600 | One per page, top-left of content area |
| Section heading | 14px | 600 | Card titles, drawer sections |
| Metric value | 26px | 600 | Tabular numerals, tight line-height 1.1 |
| Body | 14px | 400 | Forms, descriptions, empty states |
| Table cell / dense UI | 13px | 400 | The console's default text size |
| Table header / label | 11px | 600 | Uppercase, letter-spacing 0.05em, muted color |
| Metadata / timestamp | 12px | 400 | Faint color |
| Mono ID | 12px | 400 | JetBrains Mono, secondary color |
| Button | 13px | 500 | Never bold |

### Principles

- Maximum weight is 600. Emphasis comes from luminance (text color tier),
  not from bolding.
- Uppercase is reserved for 11px labels (table headers, badge text).
- No display typography anywhere — this is a tool, not a landing page.

## 4. Component Stylings

### Buttons

- **Primary**: `#10b981` bg, `#06281d` text (dark-on-accent for contrast), 6px radius, 13px/500, padding 6px 12px. Hover `#34d399`. One per view maximum.
- **Ghost (default)**: `rgba(255,255,255,0.03)` bg, `1px solid rgba(255,255,255,0.08)` border, primary text. Hover bg `0.06`.
- **Danger**: ghost shape with red-500 text and border `rgba(239,68,68,0.35)`; solid red only inside typed-confirmation dialogs.
- **Icon button**: 26×26px, 6px radius, ghost treatment.
- Disabled: 40% opacity, no hover.

### Tables (workhorse)

- Container: Panel bg, default border, 8px radius, no outer padding.
- Header row: 11px/600 uppercase muted labels, subtle bottom border, sticky.
- Rows: 36px height, 13px text, subtle border between rows; hover = Elevated bg; selected = accent-bg tint + 2px accent left edge.
- Cells: status = dot+label; IDs = mono 12px with copy-on-hover icon; timestamps = relative ("3m ago") with absolute ISO on `title`.
- Footer: cursor pagination — "Load more" ghost button + shown-count in faint text. Never page numbers.

### Badges & pills

- Status pill: 12px/500 label, 8px dot, `rgba(255,255,255,0.04)` bg, 9999px radius, 2px 8px padding. Dot carries the status color; text stays secondary.
- Count badge: mono 11px, recessed bg, 4px radius (e.g. queue depth on nav).

### Forms & inputs

- Input: Recessed bg, default border, 6px radius, 13px text, padding 7px 10px. Focus: strong border + accent ring `0 0 0 3px rgba(16,185,129,0.15)`. Error: red border + 12px red help text below.
- Selects and filters render as ghost buttons with a chevron; active filters become dismissible pills in a filter bar above tables.

### Cards (Overview only)

- Panel bg, default border, 8px radius, 16px padding.
- Metric card: 11px uppercase label → 26px tabular value → 12px faint delta/context line.

### Drawers & dialogs

- Detail views open as right-side drawers: 420–480px, Elevated bg, strong left border; header = title + mono ID + close.
- Dialogs: 480px max, Elevated bg, overlay `rgba(0,0,0,0.7)`. Destructive dialogs require typing the resource name; the confirm button stays disabled until it matches.

### Toasts

- Bottom-right, Elevated bg, status-colored 3px left edge, title 13px/500 + detail 12px, and **always** the mono `requestId` when the toast reports an API error.

### QR pairing panel

- QR renders on a white 12px-radius well (QR needs light background) inside a Recessed container, 240×240px, with expiry countdown (mono, amber when <10s) and a "Refresh QR" ghost button. Pairing state machine renders as dot+label steps: `waiting → scanned → paired`.

### Live indicator

- Header-right: 8px dot + 12px label. `live` emerald pulsing dot, `reconnecting` amber, `polling` sky, `offline` red. Clicking opens connection detail popover.

### Workspace (primary surface)

The messaging workspace is the console's center of gravity; everything in
this subsection binds to it.

- **Three-pane layout**: conversation list (300px, Panel bg) · conversation
  timeline (fluid, Canvas bg) · context panel (320px, Panel bg, collapsible).
  The workspace fills the viewport; only the timeline scrolls vertically.
- **Conversation list item**: 56px, two lines — name (13px/500) + last
  activity (12px faint) — with unread count badge (mono, accent-tint bg) and
  label chips. Selected item = accent-bg tint + 2px accent left edge. List
  header holds the instance selector (dot + name + chevron) and search.
- **Message bubbles**: max-width 68%, radius 10px, 13px text, timestamp +
  status footer (11px). Inbound = Elevated bg, left-aligned. Outbound =
  accent-tint bg with subtle border, right-aligned — the one sanctioned use
  of accent as surface. Failed outbound adds a 3px red left edge and inline
  Retry/Cancel ghost buttons. Media bubbles show a Recessed
  placeholder block + caption. Clicking a bubble opens its delivery timeline
  in the context panel.
- **Bubble status vocabulary** (footer, dot + label): `accepted` /
  `queued` amber · `delivered` emerald · `failed` red · `canceled` gray.
  Never a bare double-check mark — words, not glyphs.
- **System lines**: centered 12px muted text for non-message facts
  ("instance disconnected · 12:40"), never bubbles.
- **Day separators**: centered 11px uppercase muted label on a subtle rule.
- **Composer**: Recessed bg bar with textarea (auto-grow to 5 lines),
  attach ghost icon-button, Send primary. When the instance is not
  connected the composer is replaced by an amber warning bar with a
  "Reconnect" ghost action. Microcopy under composer: sends are
  *accepted*, delivery shows on the bubble.
- **Context panel** (right): contact card (verified name, mono id,
  read-only label chips); when a bubble is selected it shows that
  message's delivery timeline with `requestId` and retry affordance.
  The workspace serves direct chats only — groups are a management
  table, not a conversation surface.

### Management page template (Groups; reuse for Instances, Webhooks, Queue)

- **Layout**: content column (own vertical scroll, 24px side padding) +
  **full-height detail panel docked to the right viewport edge** (400px,
  Panel bg, left border, own scroll — same construction as the workspace
  context panel). Never render detail views as floating cards beside the
  table.
- **Page header**: title + instance picker together on the left (context
  before actions); header-right holds only the live indicator and at most
  one panel-level action. Refresh actions live in the **table footer**
  next to the sync-freshness text, not in the header.
- **Filter ⇄ selection bar**: one row below the header. With no selection
  it holds search + filter chips; with ≥1 row checked it swaps in place to
  "N selected · [primary bulk action] · Clear selection" — no extra strip,
  no layout jump.
- **Checkbox column**: 36px, native checkboxes with `accent-color`
  emerald; header checkbox = select all (indeterminate when partial).
- **Row state semantics** (two independent states, may combine):
  `checked` → accent-tint background only; `open` (detail panel showing
  this row) → 2px accent inset left edge only. Never one style for both.
- **Column discipline**: name and tag-like columns flex; numeric and
  time columns right-align (`tnum`); everything else sizes to content.
- Row click (outside the checkbox) opens the detail panel; the checkbox
  never does.

### Modal (Named Lists)

- 640px wide variant of the dialog spec, Elevated bg over the standard
  `rgba(0,0,0,0.7)` overlay; deep-linkable via `?list=nl_*`.
- Two-pane body: list picker left (240px, active item = accent tint),
  member table right; creation input lives in the footer.

### Campaign components (proposed contract — see docs/CAMPAIGNS_PROPOSAL.md)

- **Progress bar**: 6px track (Recessed), segments colored by outcome —
  delivered emerald, accepted/queued amber, failed red — with a mono
  `delivered / accepted / failed` count line under it. Never a single
  undifferentiated bar: outcomes stay visible.
- **Campaign status vocabulary**: `draft` gray · `scheduled` sky ·
  `running` amber (pulsing dot) · `paused` orange · `completed` emerald ·
  `aborted` red.
- **Wizard steps**: numbered dot + label row (Audience → Message → Review),
  current step accent, completed steps emerald, future muted. One primary
  action per step, always bottom-right; Back is ghost.
- **Named Lists** contain groups only, added by row-selection on the
  Groups table — the UI offers no raw-number or contact import surface,
  by design. Deleting a list is allowed; campaigns snapshot member groups
  at start, and deletion is blocked while a scheduled or running campaign
  references it.

## 5. Layout Principles

- **Shell**: fixed 224px sidebar (Panel bg, right border) + fluid content area, 24px content padding (workspace pages: 0 — the three panes are full-bleed).
- **Sidebar anatomy**: logo block (28px logomark — radius 8, accent-tint bg, accent chat glyph — beside the app name 14px/600 and the connected base URL in mono 11px); nav items (13px/500, 8px radius, 10px gap) each carrying a **16px stroke icon** (inline SVG, 1.7px stroke, round caps, `currentColor` so active items tint the icon accent) + flexing label + optional mono count badge; active = accent text + accent-tint bg. Settings lives in a border-separated `navfoot` slot pinned above the footer. The **session footer** is a Recessed block: status dot + masked key fingerprint (mono 11px) + key-kind pill + a disconnect icon-button that turns red on hover. Icons are what make the 56px icon-rail collapse (§8) possible.
- **Nav hierarchy**: **Overview** sits alone at the top (the landing page,
  spanning both concerns). Then two labeled sections — **Operations**:
  Instances (the foundational resource first), Queue & Jobs, Webhooks,
  Events (message-pipeline order); **Messaging**: Chats (direct
  conversations only), Groups (management table + Named Lists modal),
  Messages (campaigns). **Settings** is pinned at the sidebar bottom above
  the key/disconnect footer, separated by a border. There is no separate
  directory panel: contact/label lookup lives in the Chats search and
  filters.
- **Content header** per page: title left; live indicator, refresh, and primary action right. 48px tall, bottom border.
- **Grid**: 8px base unit. Vertical rhythm 16px between related blocks, 24px between sections.
- **Density**: tables full-width; Overview metric cards in `repeat(auto-fit, minmax(200px, 1fr))` grid; never center-constrain content below 1440px.
- **Instance-scoped pages** show a breadcrumb: `Instances / {name}` with mono ID, and a horizontal tab row (Chats · Contacts · Labels · Groups · Messages) under the header.
- Empty states: centered in the table container, 14px secondary text + one ghost action; never illustrations.

## 6. Depth & Elevation

| Level | Treatment | Use |
| --- | --- | --- |
| 0 Canvas | `#0b0c0e`, no border | Page background |
| 1 Panel | `#121316` + default border | Tables, cards, sidebar |
| 2 Elevated | `#1a1c20` + default border | Hover rows, drawers, dropdowns |
| 2b Recessed | `#08090a` + subtle border | Inputs, code wells, QR container |
| 3 Overlay | Elevated + `rgba(0,0,0,0.7)` backdrop | Dialogs, command palette |

No drop shadows except a single `0 8px 24px rgba(0,0,0,0.4)` on floating
elements (dropdowns, toasts, popovers). Depth = luminance stepping.

## 7. Do's and Don'ts

### Do

- Render every status as dot + label using the frozen vocabulary in §2.
- Put every ID in mono with copy affordance; surface `requestId` on every error.
- Use tabular numerals on all metrics and counts.
- Keep exactly one primary (emerald) action per view.
- Show async-accepted states honestly: "Accepted", "Queued" — never "Sent" until the delivery history says so.
- Reflect filters/cursors into the URL; every view is a shareable deep link.

### Don't

- Don't use gradients, glassmorphism, illustrations, or decorative icons.
- Don't signal with color alone, and don't invent status colors outside §2.
- Don't use weight 700+, display sizes, or letter-spacing tricks.
- Don't use shadows for elevation on dark surfaces (luminance steps instead).
- Don't center-max-width the app like a document; this is a full-bleed tool.
- Don't render WhatsApp-green (`#25D366`) UI chrome — the accent is emerald `#10b981`, and the console is not a WhatsApp clone.

## 8. Responsive Behavior

Primary target is desktop ≥1280px. The console must remain *usable*, not
optimized, down to 768px:

| Range | Behavior |
| --- | --- |
| ≥1280px | Full shell, drawers overlay content |
| 1024–1280px | Sidebar collapses to 56px icon rail with tooltips |
| 768–1024px | Metric grid wraps; tables gain horizontal scroll within their container (never page-level) |
| <768px | Not supported; show a "best on desktop" note, keep read-only views functional |

Touch targets minimum 32px on interactive rows and buttons at all sizes.

## 9. Agent Prompt Guide

### Quick reference

- Canvas `#0b0c0e` · Panel `#121316` · Elevated `#1a1c20` · Recessed `#08090a`
- Text `#f4f5f6` / `#b6bcc4` / `#7c828c` / `#565b63`
- Accent `#10b981` (hover `#34d399`) — actions and live states only
- Status: ok `#10b981` · pending `#f59e0b` · degraded `#f97316` · failed `#ef4444` · info `#38bdf8` · inactive `#7c828c`
- Border `rgba(255,255,255,0.07)` default, `0.05` subtle, `0.12` strong
- Inter 13px is the default; mono = JetBrains Mono 12px; max weight 600
- Radius: 6px controls, 8px containers, 9999px pills

### Example component prompts

- "Build an instance table on `#121316` with `1px solid rgba(255,255,255,0.07)` border, 8px radius. Sticky header row: 11px/600 uppercase `#7c828c`. Rows 36px, 13px `#f4f5f6`, hover `#1a1c20`. Status cell: 8px dot (`#10b981` connected / `#f59e0b` pairing / `#ef4444` disconnected) + 12px `#b6bcc4` label. ID cell: JetBrains Mono 12px `#b6bcc4`."
- "Metric card: `#121316` bg, default border, 8px radius, 16px padding. Label 11px/600 uppercase `#7c828c`, value 26px/600 `#f4f5f6` with `font-feature-settings:'tnum'`, context line 12px `#565b63`."
- "QR pairing panel: `#08090a` recessed container, inside it a 240px white well (12px radius) holding the QR, expiry countdown in JetBrains Mono 12px turning `#f59e0b` under 10s, 'Refresh QR' ghost button below."

### Iteration guide

1. Start every screen from the shell (sidebar + content header) — panels never float alone.
2. Reach for a table before a card grid; cards are Overview-only.
3. Apply the status vocabulary before styling anything else — it is the product's core language.
4. Check honesty last: accepted ≠ delivered, sample data labeled as sample, `requestId` visible on errors.

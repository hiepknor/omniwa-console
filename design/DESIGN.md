# OmniWA Console Design System

> Category: Operations & Infrastructure
> WhatsApp platform operations console using the Open Design Warp system.
> Source: `od://design-systems/warp/DESIGN.md`.

This is the brand contract for `omniwa-console`. Prototypes in
`design/prototypes/` and all implemented panels bind to it. Where this file
is silent, follow the dense-operational defaults of the `frontend-design`
craft rules; where they conflict, this file wins.

## 1. Visual Theme & Atmosphere

OmniWA Console is a **dense operational console**, not a marketing dashboard.
The operator lives here during incidents: scanning instance lifecycles,
tracing a message through queue → provider → delivery, redriving webhook
batches. Everything optimizes for scanability under stress — high information
density and unambiguous status vocabulary. The visual language follows Open
Design's Warp system: warm near-black surfaces, parchment text, regular-weight
typography, mist borders, and almost monochromatic controls.

The canvas is warm near-black (`#171715`), not cold blue-black. Panels use
barely visible warm overlays and semi-transparent mist borders. Primary text
is Warm Parchment (`#faf9f6`), never pure white. Interaction is communicated
through opacity and border brightness instead of saturated accent colors.
Operational statuses retain muted semantic hues because this is a live console,
but those hues never become decorative chrome.

Identifiers are first-class citizens: instance IDs, request IDs, cursors,
and job IDs always render in monospace with a copy affordance. An operator
should be able to go from any error toast to a log query in one copy-paste.

**Key characteristics:**

- Dark-mode-native: `#171715` canvas, `#1d1d1b` panels, `#292927` elevated surfaces
- Matter Regular for UI text; Matter Mono / Geist Mono for identifiers and technical values
- Warm Parchment (`#faf9f6`) foreground with Ash and Stone gray hierarchy
- No brand accent, gradients, or glow; interaction uses opacity and mist borders
- Status is always **dot + label**, never color alone
- Tables at 13px are the workhorse component; cards exist only on Overview
- Borders `rgba(255,255,255,0.06–0.09)`; elevation by luminance stepping, not shadow

## 2. Color Palette & Roles

### Background surfaces

- **Canvas** (`#171715`): warm near-black page background.
- **Panel** (`#1d1d1b`): sidebar, table containers, cards.
- **Elevated** (`#292927`): dropdowns, drawers, dialogs, row hover.
- **Recessed** (`#111110`): code/QR wells, input backgrounds.

### Text

- **Primary / Warm Parchment** (`#faf9f6`): headings, cell values.
- **Secondary / Ash Gray** (`#afaeac`): body, descriptions.
- **Muted / Stone Gray** (`#868584`): metadata, column headers, placeholders.
- **Faint / Purple-Tint Gray** (`#666469`): timestamps, disabled, de-emphasized counts.

### Brand & accent

- **Earth Gray** (`#353534`): button backgrounds and interactive surfaces.
- **Frosted Veil** (`rgba(255,255,255,0.04)`): selected rows and surface differentiation.
- **Mist Border** (`rgba(226,226,226,0.35)`): primary containment.
- **Healthy/live** uses a muted semantic green only where status meaning requires it.

### Status vocabulary (the only other chromatic colors)

| Status | Color | Used for |
| --- | --- | --- |
| `ok / connected / delivered / active` | `#8fae99` | Healthy lifecycle states |
| `pending / pairing / queued / accepted` | `#b2a17f` | In-flight, waiting states |
| `degraded / retrying / suspended` | `#b08d79` | Needs attention, self-recovering |
| `failed / disconnected / dead` | `#b78486` | Terminal failures, action required |
| `info / streaming` | `#8e9eaa` | Neutral events, SSE activity |
| `retired / archived / unknown` | `#777674` | Inactive, no action possible |

Status renders as an 8px dot + 12px label. Color-only signaling is forbidden
(accessibility and print).

### Borders

- **Default / Mist** (`rgba(226,226,226,0.35)`): tables, cards, major containment.
- **Subtle** (`rgba(226,226,226,0.12)`): row dividers, section separators.
- **Strong** (`rgba(226,226,226,0.50)`): focused inputs, active drawer edge.

## 3. Typography Rules

### Families

- **UI**: `Matter Regular`, fallback `Inter`, system sans-serif. Enable `font-feature-settings: "tnum"` wherever numbers align vertically.
- **Mono**: `Matter Mono Regular`, fallback `Geist Mono`, `JetBrains Mono`, system monospace. All IDs, cursors, JIDs, payload keys, code.

### Hierarchy

| Role | Size | Weight | Notes |
| --- | --- | --- | --- |
| Page title | 18px | 400 | One per page, top-left of content area |
| Section heading | 14px | 500 | Card titles, drawer sections |
| Metric value | 26px | 400 | Tabular numerals, tight line-height 1.1 |
| Body | 14px | 400 | Forms, descriptions, empty states |
| Table cell / dense UI | 13px | 400 | The console's default text size |
| Table header / label | 11px | 400 | Uppercase, letter-spacing 0.15em, muted color |
| Metadata / timestamp | 12px | 400 | Faint color |
| Mono ID | 12px | 400 | Matter Mono / Geist Mono, secondary color |
| Button | 13px | 500 | Never bold |

### Principles

- Maximum weight is 500. Emphasis comes from luminance (text color tier),
  not from bolding.
- Uppercase is reserved for 11px labels (table headers, badge text).
- No display typography anywhere — this is a tool, not a landing page.

## 4. Component Stylings

### Buttons

- **Primary**: Earth Gray `#353534`, Warm Parchment text, pill radius, 13px/500, padding 6px 12px. Hover changes brightness only. One per view maximum.
- **Ghost (default)**: `rgba(255,255,255,0.03)` bg, `1px solid rgba(255,255,255,0.08)` border, primary text. Hover bg `0.06`.
- **Danger**: ghost shape with red-500 text and border `rgba(239,68,68,0.35)`; solid red only inside typed-confirmation dialogs.
- **Icon button**: 26×26px, 6px radius, ghost treatment.
- Disabled: 40% opacity, no hover.

### Tables (workhorse)

- Container: Panel bg, default border, 8px radius, no outer padding.
- Header row: 11px/400 uppercase muted labels with wide tracking, subtle bottom border, sticky.
- Rows: 36px height, 13px text, subtle border between rows; hover/selection use Frosted Veil opacity changes.
- Cells: status = dot+label; IDs = mono 12px with copy-on-hover icon; timestamps = relative ("3m ago") with absolute ISO on `title`.
- Footer: cursor pagination — "Load more" ghost button + shown-count in faint text. Never page numbers.

### Badges & pills

- Status pill: 12px/500 label, 8px dot, `rgba(255,255,255,0.04)` bg, 9999px radius, 2px 8px padding. Dot carries the status color; text stays secondary.
- Count badge: mono 11px, recessed bg, 4px radius (e.g. queue depth on nav).

### Forms & inputs

- Input: Recessed bg, subtle border, 6px radius, 13px text, padding 7px 10px. Focus increases border brightness without a colored ring. Error: muted-red border + 12px error text below.
- Selects and filters render as ghost buttons with a chevron; active filters become dismissible pills in a filter bar above tables.

### Cards (Overview only)

- Panel bg, default border, 8px radius, 16px padding.
- Metric card: 11px uppercase label → 26px tabular value → 12px faint delta/context line.

### Overview command surface

- Scan order is fixed: compact system-health posture → five comparable metrics → action-required work queue → bounded live-event stream.
- Health uses a quiet bordered strip with dot + label states; degraded services remain visible without becoming a saturated alert banner.
- The five metric cards share equal visual weight and dense spacing. They may wrap from five to three, two, then one column, but values and labels remain directly comparable.
- Action required is the primary content column. Its semantic table keeps status, resource ID/name, age, and a contextual row action aligned; horizontal overflow stays inside the table container.
- Live events is secondary and uses a bounded, keyboard-reachable stream with monospaced event/resource fields and right-aligned age.

### Drawers & dialogs

- Detail views open as right-side drawers: 420–480px, Elevated bg, strong left border; header = title + mono ID + close.
- Dialogs: 480px max, Elevated bg, overlay `rgba(0,0,0,0.7)`. Destructive dialogs require typing the resource name; the confirm button stays disabled until it matches.

### Toasts

- Bottom-right, Elevated bg, status-colored 3px left edge, title 13px/500 + detail 12px, and **always** the mono `requestId` when the toast reports an API error.

### QR pairing panel

- QR renders on a white 12px-radius well (QR needs light background) inside a Recessed container, 240×240px, with expiry countdown (mono, amber when <10s) and a "Refresh QR" ghost button. Pairing state machine renders as dot+label steps: `waiting → scanned → paired`.

### Instances lifecycle surface

- The lifecycle table is always the primary surface. It combines search, active filters, freshness, dense status scanning, right-aligned message counts, and cursor pagination without switching to device cards.
- Opening an instance marks the row with both a restrained edge and a text label, then presents a 440px right slide-over without a backdrop or reserved table column. Below 900px, the slide-over becomes a full-width in-flow panel.
- Drawer hierarchy is fixed: identity + status → compact facts → QR pairing → lifecycle controls → sessions → provider capabilities.
- Recovery actions are separated from destructive actions. Disconnect and Destroy only launch the typed-confirmation pattern; confirmation is never rendered inline in the drawer.
- QR remains on a light well with a visible expiry and numbered `waiting for scan → scanned → paired` progression. The UI must not imply that pairing completed before the lifecycle state confirms it.

### Live indicator

- Header-right: 8px dot + 12px label. `live` emerald pulsing dot, `reconnecting` amber, `polling` sky, `offline` red. Clicking opens connection detail popover.

### Workspace (primary surface)

The messaging workspace is the console's center of gravity; everything in
this subsection binds to it.

- **Three-pane layout**: conversation list (300px, Panel bg) · conversation
  timeline (fluid, Canvas bg) · context panel (320px, Panel bg, collapsible).
  The workspace fills the viewport; only the timeline scrolls vertically.
- **Conversation list item**: 56px, two lines — name (13px/500) + last
  activity (12px faint) — with unread count badge (mono, Frosted Veil bg) and
  label chips. Selected item = slightly brighter Frosted Veil. List
  header holds the instance selector (dot + name + chevron) and search.
- **Message bubbles**: max-width 68%, radius 10px, 13px text, timestamp +
  status footer (11px). Inbound = Elevated bg, left-aligned. Outbound =
  Frosted Veil bg with Mist Border, right-aligned. Failed outbound adds a
  3px muted-red left edge and inline
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

- **Layout**: the table is full-width by default — nothing reserves
  horizontal space. Detail views and panel modes open **on demand as a
  400px slide-over** fixed to the right viewport edge (Panel bg, left
  border, own scroll, `-16px 0 40px` shadow, **no backdrop** so the table
  underneath stays visible and interactive); closed via ✕ or Esc. Never
  render detail views as floating cards beside the table, and never dock
  a permanently-open panel on management pages (the docked context panel
  is a workspace-page pattern only).
- **Metric cards** above the filter row: use the same `.metrics > .card`
  component as Queue & Jobs (uppercase label, 26px tabular value, faint
  context line). Management pages must not introduce a second summary style.
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
  `checked` → Frosted Veil background only; `open` (detail panel showing
  this row) → stronger Mist Border inset edge only. Never one style for both.
- **Column discipline**: name and tag-like columns flex; numeric and
  time columns right-align (`tnum`); everything else sizes to content.
- Row click (outside the checkbox) opens the detail panel; the checkbox
  never does.

### Dropdown menu (quick actions)

- Anchored below its trigger button (6px gap): Elevated bg, default
  border, 8px radius, floating shadow, 4px inner padding; items are
  13px/500 rows (6px radius, hover = white 5%) with a mono count on the
  right; a subtle divider separates an inline "create from selection"
  input row at the bottom. Used by "Add to Named List ▾" on the bulk bar
  and in the group detail panel.

### Named Lists panel mode (Groups)

- The "Named Lists" header button (and any "In lists" chip) switches the
  docked detail panel into list-management mode — never a modal, so the
  table stays visible and selectable. Deep link `?list=nl_*`.
- Panel anatomy top-to-bottom: mode header with close; list picker
  (Frosted Veil active item; each row shows name, mono id, group count,
  and "used by N campaigns") with an inline create input; selected-list
  section with Rename/Delete (guarded), a **selection strip**
  (Frosted Veil band: "N groups selected on the table → Add to this
  list") whenever table rows are checked, a member search input, and the
  member list with per-row Remove.

### Campaign components (proposed contract — see docs/CAMPAIGNS_PROPOSAL.md)

- **Progress bar**: 6px track (Recessed), segments colored by outcome —
  delivered emerald, accepted/queued amber, failed red — with a mono
  `delivered / accepted / failed` count line under it. Never a single
  undifferentiated bar: outcomes stay visible.
- **Campaign status vocabulary**: `draft` gray · `scheduled` sky ·
  `running` amber (pulsing dot) · `paused` orange · `completed` emerald ·
  `aborted` red.
- **Wizard steps**: numbered dot + label row (Audience → Message → Review),
  current step uses an Earth Gray pill, completed steps use muted healthy status, future muted. One primary
  action per step, always bottom-right; Back is ghost.
- **Named Lists** contain groups only, added by row-selection on the
  Groups table — the UI offers no raw-number or contact import surface,
  by design. Deleting a list is allowed; campaigns snapshot member groups
  at start, and deletion is blocked while a scheduled or running campaign
  references it.

## 5. Layout Principles

- **Shell**: sticky 224px warm near-black sidebar (subtle right border) + fluid content area, 24px content padding (workspace pages: 0 — the three panes are full-bleed).
- **Sidebar anatomy**: 64px-tall logo block (32px mark on Earth Gray — beside the app name 14px/500 and base URL in mono 10px); nav items (13px/400, 6px radius, 10px gap) each carry a 17px stroke icon + label + optional mono count badge; active = Warm Parchment text on Frosted Veil with a subtle Mist edge. Settings stays pinned above a contained session footer showing connected status, fingerprint, key kind, and disconnect.
- **Nav hierarchy**: **Overview** sits alone at the top (the landing page,
  spanning both concerns). Then two labeled sections — **Operations**:
  Instances (the foundational resource first), Queue & Jobs, Webhooks,
  Events (message-pipeline order); **Messaging**: Chats (direct
  conversations only), Groups (management table + Named Lists modal),
  Messages (campaigns). **Settings** is pinned at the sidebar bottom above
  the key/disconnect footer, separated by a border. There is no separate
  directory panel: contact/label lookup lives in the Chats search and
  filters.
- **Page header**: a 64px shared contract on desktop with a subtle bottom border. The left context cluster contains an optional 10px uppercase section label or breadcrumb, the 18px/400 title, and compact contextual metadata such as an instance selector or contract badge. The right action cluster contains connection state and at most one primary action; refresh and pause remain restrained secondary controls. At ≤640px the header becomes a single-column stack with context before actions and 44px action targets. Workspace pages apply the same hierarchy to their internal thread header instead of adding a global header.
- **Grid**: 8px base unit. Vertical rhythm 16px between related blocks, 24px between sections.
- **Density**: tables full-width; Overview metric cards in `repeat(auto-fit, minmax(200px, 1fr))` grid; never center-constrain content below 1440px.
- **Instance-scoped pages** show a breadcrumb: `Instances / {name}` with mono ID, and a horizontal tab row (Chats · Contacts · Labels · Groups · Messages) under the header.
- Empty states: centered in the table container, 14px secondary text + one ghost action; never illustrations.

## 6. Depth & Elevation

| Level | Treatment | Use |
| --- | --- | --- |
| 0 Canvas | `#171715`, no gradient | Page background |
| 1 Panel | `#1d1d1b` + Frosted Veil | Tables, cards, sidebar |
| 2 Elevated | `#292927` + Mist Border | Hover rows, drawers, dropdowns |
| 2b Recessed | `#111110` + subtle border | Inputs, code wells, QR container |
| 3 Overlay | Elevated + `rgba(0,0,0,0.7)` backdrop | Dialogs, command palette |

Base content uses luminance stepping and borders. Regular cards have no shadow;
only floating elements may use `0 5px 15px rgba(0,0,0,0.2)`. There is no glow
or backdrop blur.

## 7. Do's and Don'ts

### Do

- Render every status as dot + label using the frozen vocabulary in §2.
- Put every ID in mono with copy affordance; surface `requestId` on every error.
- Use tabular numerals on all metrics and counts.
- Keep exactly one restrained Earth Gray primary action per view.
- Show async-accepted states honestly: "Accepted", "Queued" — never "Sent" until the delivery history says so.
- Reflect filters/cursors into the URL; every view is a shareable deep link.

### Don't

- Don't use decorative gradients or glow.
- Don't use cold blue-tinted dark backgrounds.
- Don't signal with color alone, and don't invent status colors outside §2.
- Don't use weight 700+, display sizes, or letter-spacing tricks.
- Don't use shadows for elevation on dark surfaces (luminance steps instead).
- Don't center-max-width the app like a document; this is a full-bleed tool.
- Don't render WhatsApp-green (`#25D366`) UI chrome. Muted green is reserved for healthy/live/delivered status only.

## 8. Responsive Behavior

Primary target is desktop ≥1280px. The shell remains operable across narrower
viewports without changing its information hierarchy:

| Range | Behavior |
| --- | --- |
| ≥1280px | Full shell, drawers overlay content |
| 641–900px | Sidebar collapses to a 64px icon rail; every link retains `title` and `aria-label`, and session status/disconnect remain available |
| 641–1024px | Metric grid wraps; tables gain horizontal scroll within their container (never page-level) |
| ≤640px | Navigation becomes a fixed 72px bottom bar with icon + visible label; items scroll horizontally and Settings remains separated at the end |

Navigation touch targets are at least 44px; mobile controls use 44px where density permits.

## 9. Agent Prompt Guide

### Quick reference

- Canvas `#171715` · Panel `#1d1d1b` · Elevated `#292927` · Recessed `#111110`
- Text `#faf9f6` / `#afaeac` / `#868584` / `#666469`
- Controls `#353534`; no saturated brand accent
- Status: muted semantic hues only; never reused as chrome
- Border `rgba(226,226,226,0.35)` default, `0.12` subtle, `0.50` strong
- Matter Regular 13px is the default; mono = Matter Mono / Geist Mono 12px; max weight 500
- Radius: 6px inputs, 12px blocks, 9999px buttons and pills

### Example component prompts

- "Build an instance table on a 4% white veil with a 35%-alpha Mist Border and 12px radius. Sticky header row: 11px/400 uppercase Stone Gray with 2.4px tracking. Rows 36px, 13px Warm Parchment; hover uses a barely visible white veil. Status remains muted semantic dot + label."
- "Metric block: Frosted Veil surface, Mist Border, 12px radius, 16px padding, no shadow. Label 11px/400 uppercase Stone Gray, value 26px/400 Warm Parchment with tabular numerals, context line 12px Purple-Tint Gray."
- "QR pairing block: `#111110` recessed container, inside it a 240px white well holding the QR, expiry countdown in Matter Mono 12px turning muted amber under 10s, Earth Gray pill button below."

### Iteration guide

1. Start every screen from the shell (sidebar + content header) — panels never float alone.
2. Reach for a table before a card grid; cards are Overview-only.
3. Apply the status vocabulary before styling anything else — it is the product's core language.
4. Check honesty last: accepted ≠ delivered, sample data labeled as sample, `requestId` visible on errors.

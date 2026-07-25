# OmniWA Console Design System

> Category: Operations & Infrastructure
> WhatsApp platform operations console using the Open Design Warp system.
> Source: `od://design-systems/warp/DESIGN.md`.

This is the brand contract for `omniwa-console`. **The v2 console is the
product this contract describes.** Canonical tokens (`src/styles/tokens.css`)
and the shared v2 primitives (`src/components/v2`, `src/styles/ui-v2.css`) are
the implementation source of truth — where this document and the code disagree,
the code wins and this document is corrected. Legacy v1 prototypes in
`design/prototypes/` and legacy v1 feature code may illustrate existing journeys
but must import canonical tokens and may not own runtime component geometry.
Surfaces that exist only in v1 and have not been carried into the v2 shell are
catalogued in the Appendix, not in the main body. Where this file is silent,
follow the dense-operational defaults of the `frontend-design` craft rules;
where they conflict, this file wins.

The production component gallery at `/__ui-v2` is available only in local
development and renders the same primitives used by v2 routes. New foundation
states are reviewed there instead of being built as parallel static HTML/CSS.

## 1. Visual Theme & Atmosphere

OmniWA Console is a **dense operational console**, not a marketing dashboard.
The operator lives here during incidents: scanning instance lifecycles,
tracing a message through queue → provider → delivery, redriving webhook
batches. Everything optimizes for scanability under stress — high information
density and unambiguous status vocabulary. The visual language follows Open
Design's Warp system: warm near-black surfaces, parchment text, regular-weight
typography, mist borders, and almost monochromatic controls.

The canvas is warm near-black (`#161412`), not cold blue-black. Panels use
barely visible warm overlays and semi-transparent mist borders. Primary text
is Warm Parchment (`#faf9f6`), never pure white. Interaction is communicated
through opacity and border brightness instead of saturated accent colors.
Operational statuses retain muted semantic hues because this is a live console,
but those hues never become decorative chrome.

Identifiers are first-class citizens: instance IDs, request IDs, cursors,
and job IDs always render in monospace with a copy affordance. An operator
should be able to go from any error toast to a log query in one copy-paste.

**Key characteristics:**

- Dark-mode-native: `#161412` canvas, `#1f1d1b` panels, `color-mix(in oklab, var(--surface), var(--fg) 4%)` elevated surfaces
- Matter Regular for UI text; Geist Mono / Matter Mono for identifiers and technical values
- Warm Parchment (`#faf9f6`) foreground with Ash and Stone gray hierarchy
- No brand accent, gradients, or glow; interaction uses opacity, warm-parchment veils, and mist borders
- Status is always **dot + label**, never color alone
- Tables at 13px are the workhorse component; the bordered metric grid is Overview/workbench-only
- Borders default at `rgba(226,226,226,0.35)` and step by luminance, not shadow

## 2. Color Palette & Roles

All values below are defined in `src/styles/tokens.css`. Product code references
the aliased tokens (`--canvas`, `--panel`, `--ok`, …); the base tokens
(`--bg`, `--success`, …) are the raw inputs those aliases mix from.

### Background surfaces

- **Canvas** — `--canvas` = `--bg` (`#161412`): warm near-black page background.
- **Panel** — `--panel` = `--surface` (`#1f1d1b`): sidebar rail, table containers, inspectors, dialogs.
- **Elevated** — `--elevated` = `color-mix(in oklab, var(--surface), var(--fg) 4%)`: raised surfaces and hover states.
- **Recessed** — `--recessed` = `color-mix(in oklab, var(--bg), black 12%)`: inputs, code/QR wells, message bubbles.

### Text

- **Primary / Warm Parchment** — `--text-1` = `--fg` (`#faf9f6`): headings, cell values.
- **Secondary / Ash Gray** — `--text-2` = `--fg-2` (`#afaeac`): body, descriptions.
- **Muted / Stone Gray** — `--text-3` = `--muted` (`#868584`): metadata, column headers, placeholders.
- **Faint / Purple-Tint Gray** — `--text-4` = `--meta` (`#666469`): timestamps, disabled, de-emphasized counts.

### Brand, accent & veils

- **Earth Gray** — `--accent` (`#353534`): the single primary-action surface; `--accent-hover` (`#454545`) brightens on hover.
- **Accent text** — primary buttons render Warm Parchment (`var(--fg)`) on Earth Gray. The `--accent-on` token (`#afaeac`) is reserved for muted-on-accent contexts.
- **Frosted Veil** — `--accent-tint` = `color-mix(in oklab, var(--fg) 8%, transparent)`: a warm-parchment veil for selected rows and surface differentiation. Row-level states use lighter parchment mixes (`fg 3–7%`) for hover / selected / open.
- Interaction never introduces a saturated brand accent, gradient, or glow.

### Status vocabulary (the only other chromatic colors)

The status token set mixes each raw semantic hue toward a foreground gray so
it reads muted on the warm canvas:

| Role | Token | Definition | Used for |
| --- | --- | --- | --- |
| `ok / connected / delivered / active` | `--ok` | `color-mix(in oklab, var(--success), var(--fg-2) 52%)` | Healthy lifecycle states |
| `pending / pairing / queued / accepted` | `--pending` | `color-mix(in oklab, var(--warn), var(--fg-2) 56%)` | In-flight, waiting states |
| `degraded / retrying / suspended` | `--degraded` | `color-mix(in oklab, var(--warn), var(--danger) 38%)` | Needs attention, self-recovering |
| `failed / disconnected / dead` | `--failed` | `color-mix(in oklab, var(--danger), var(--fg-2) 55%)` | Terminal failures, action required |
| `info / streaming` | `--info` | `color-mix(in oklab, var(--muted), var(--fg-2) 44%)` | Neutral events, live activity |
| `retired / archived / unknown` | `--inactive` | `var(--muted)` | Inactive, no action possible |

Raw semantic inputs: `--success #16a34a`, `--warn #eab308`, `--danger #dc2626`.

The shared `<Status>` primitive renders an 8px dot + 12px label and maps its
`tone` prop to four dot colors — `healthy → --ok`, `pending`, `degraded`,
`failed` — with a neutral `--inactive` dot as the default. Color-only signaling
is forbidden (accessibility and print); the label always carries the meaning.

### Borders

- **Default / Mist** — `--border` (`rgba(226,226,226,0.35)`): the raw border input.
- **Subtle** — `--border-subtle` = `color-mix(in oklab, var(--border) 36%, transparent)` (≈`0.12` alpha): the workhorse divider for rows, sections, surfaces, tables, and nav.
- **Strong** — `--border-strong` = `color-mix(in oklab, var(--border), var(--fg) 22%)`: focused inputs, active/open row edges, dialog edges. Strength comes from brightening toward the foreground, not from raising alpha.
- **Accent edge** — `--accent-edge` = `color-mix(in oklab, var(--fg) 42%, transparent)`: primary-button border.

## 3. Typography Rules

### Families

- **UI** — `--font-body`: `Matter Regular`, fallback `Matter`, `Inter`, system sans-serif. Enable `font-feature-settings: "tnum"` wherever numbers align vertically.
- **Mono** — `--font-mono`: `Geist Mono` first, then `Matter Mono Regular`, then system monospace. All IDs, cursors, JIDs, payload keys, versions, code, and metric values.

### Hierarchy (as implemented in `ui-v2.css`)

| Role | Size / line | Weight | Notes |
| --- | --- | --- | --- |
| Root / body default | 14px / 1.5 | 400 | `.ui-v2-root` base |
| Page title (`h1`) | 22px / 30px | 400 | One per page, `letter-spacing -0.02em` |
| Inspector title (`h2`) | 16px / 24px | 500 | Detail inspector header |
| Surface / section heading | 14px / 20px | 500 | Card and surface titles |
| Metric value | 24px / 32px | 400 | **Mono**, tabular numerals |
| Table cell / dense UI | 13px | 400 | Control default (`--control-font-size`) |
| Status / mono ID | 12px | 400 | `<Status>` label and `.ui-v2-mono` |
| Field label | 11px | 400 | Uppercase, tracking `1.4px`, muted |
| Table header | 11px / 16px | 400 | Uppercase, tracking `1.4px`, muted |
| Eyebrow / metric label / mobile cell label | 10px | 400 | Uppercase, tracking `1.2–2.2px`, muted |
| Nav section label / select label | 9px | 400 | Uppercase, tracking `1.2–1.8px`, muted |

On coarse pointers `--control-font-size` bumps to 16px to keep tap targets legible.

### Principles

- Maximum weight is 500. Emphasis comes from luminance (text color tier), not from bolding.
- Uppercase is reserved for small labels (≤11px): table headers, field labels, eyebrows, nav section labels.
- No display typography in product surfaces — this is a tool, not a landing page. (The `--text-2xl … --text-4xl` scale in `tokens.css` is inherited Warp marketing type and is intentionally unused by the console.) The only large type is the Connect entry masthead headline (`clamp(36px, 4.2vw, 56px)`), which is a deliberate single exception.

## 4. Foundations & Tokens

### Spacing & layout scale

- Spacing: `--space-1..--space-12` = 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48px on an 8px base.
- Container: product pages are full-bleed with responsive gutters (`--container-gutter-desktop 32px`, `tablet 24px`, `phone 16px`). Only the `/__ui-v2` gallery and Connect center at `--container-max 1500px`.

### Radius

- `--radius-sm 6px`: inputs, nav items, buttons-as-controls, tables/wrappers, small blocks.
- `--radius-md 12px`: surfaces, dialogs, message bubbles.
- `--radius-lg 14px`: reserved large blocks.
- `--radius-pill 9999px`: buttons, status pills, count/tab badges, environment chips.

### Elevation

| Token | Value | Use |
| --- | --- | --- |
| `--elev-flat` | `none` | Base panels, cards, tables |
| `--elev-ring` | `0 0 0 1px var(--border)` | Hairline containment |
| `--elev-raised` | `0 5px 15px rgba(0,0,0,0.2)` | Floating: inspectors, dialogs |
| `--focus-ring` | `0 0 0 2px rgba(250,249,246,0.5)` | Keyboard `:focus-visible` on every interactive element |

Base content uses luminance stepping and borders, never shadow. The focus ring
is a parchment (not chromatic) 2px halo applied only on `:focus-visible`;
inputs additionally brighten their border to `--border-strong` on focus.

## 5. Component Stylings

### Buttons (`.ui-v2-button`)

- **Ghost (default)**: `color-mix(in oklab, var(--fg) 3%, transparent)` bg, `1px solid var(--border-subtle)`, primary text, pill radius, 13px/500, `6px 12px` padding, `min-height 36px`. Hover raises border to `--border-strong` and bg to `fg 7%`.
- **Primary** (`--primary`): Earth Gray (`--accent`) bg, Warm Parchment text, `--accent-edge` border. Hover brightens to `--accent-hover`. One per view maximum.
- **Danger** (`--danger`): ghost shape with `--failed` text and a `danger 42%` border; solid red only inside typed-confirmation dialogs.
- Disabled: 40% opacity, no hover. On phone and coarse pointers buttons grow to `min-height 44px`.

### Inputs (`.ui-v2-input`)

- Recessed bg, `--border-subtle`, 6px radius, `min-height 40px`, `8px 10px` padding, 13px text. Hover raises the border to `--border`; focus adds the parchment focus ring.
- Invalid state (`aria-invalid="true"`) uses a `danger 56%` border; error text renders below in faint color.
- Selects and filters render as ghost controls with a chevron; active filters become dismissible pills in the toolbar above tables.

### Tables (workhorse — `.ui-v2-table`)

- Wrapper (`.ui-v2-table-wrap`): `overflow: auto`, `--border-subtle`, 6px radius — the locally bounded horizontal scroller. The page itself never gains horizontal overflow.
- Table: `table-layout: fixed`, `min-width: 620px` on desktop so wide semantic tables scroll inside the wrapper.
- Header + body cells share a 44px row height and `8px 12px` padding. Headers are 11px/400 uppercase Stone Gray with `1.4px` tracking and a subtle bottom border; body cells are 13px Warm Parchment. Row hover is a restrained `fg 4%` veil.
- Cells: status = dot + label; IDs = mono 12px with copy affordance; timestamps = relative ("3m ago") with absolute ISO on `title`; numeric and time values use tabular numerals and align right where comparison benefits.
- At ≤640px the header row is hidden and each cell becomes a `label / value` grid (a 104px `data-label` column in 10px uppercase muted + the value) — continuous adaptive rows, never cards.
- Cursor pagination uses a "Load more" ghost button plus shown-count and freshness in faint text; never page numbers.

### Metric grid (`.ui-v2-metric-grid` — Overview, Groups, workbenches)

- A single bordered contiguous grid, not a set of floating cards: hairline `--border-subtle` cell separators, `min-height 96px` cells, `12px` padding.
- Each cell is a 10px uppercase muted label (`1.2px` tracking) above a **24px mono** value. Cells share equal visual weight so values stay directly comparable.
- The grid wraps down to 2 then 1 column at tablet/phone widths without changing metric hierarchy. Missing values render `Not reported`, never zero.

### Status (`.ui-v2-status`)

- Inline `8px dot + 12px label`, gap `8px`, label in secondary text. The dot carries the tone color; the label always carries the meaning. This is the product's core visual language — apply it before styling anything else.

### Tabs (`.ui-v2-tabs`)

- Underline tabs: `min-height 40px`, 12px labels, a 2px transparent bottom border that becomes `--fg` when `aria-selected`. Optional trailing count badge is a mono 10px pill. Used for the Events stream ⇄ audit mode switch.

### Inspectors (detail views — `.ui-v2-inspector`)

- Detail views open as a right-anchored inspector inside a fixed overlay layer (`.ui-v2-inspector-layer`) with a warm scrim (`color-mix(in oklab, var(--bg) 74%, transparent)`).
- Inspector: `width: min(440px, 100%)`, full viewport height, Panel bg, `--border` left edge, `--elev-raised`. Header is a `min-height 104px` cluster (title `h2` 16px/500 + subtitle + close) on Canvas bg; body scrolls.
- At ≤640px the layer anchors to the bottom and the inspector becomes a full-width bottom sheet with rounded top corners. Closed via ✕ or Esc.

### Dialogs (`.ui-v2-dialog`)

- `width: min(520px, 100%)`, `--border-strong`, 12px radius, Panel bg, `--elev-raised`, centered in a scrimmed layer (same `bg 74%` overlay). At ≤640px it becomes a bottom sheet.
- Destructive dialogs require typing the resource name; the confirm button stays disabled until it matches, and only then may use a solid red confirm.

### Toasts

- Bottom-right, Elevated bg, status-colored 3px left edge, title 13px/500 + detail 12px, and **always** the mono `requestId` when the toast reports an API error.
- Toasts are reserved for transient command feedback or user-triggered errors whose originating surface has closed. Background reads never create toasts.
- Accepted commands use pending semantics and the word `accepted`; they never claim completion. Accepted toasts dismiss after six seconds, while error toasts remain until dismissed or replaced by `dedupeKey`.
- Persistent transport, session, permission, and storage conditions use the same feedback anatomy as an in-flow notice or workspace banner and remain visible until resolved.
- The complete lifecycle, placement, deduplication, and accessibility policy lives in `docs/FEEDBACK.md`.

### Connect entry surface (`ConnectPageV2`)

- Connect is the only full-screen surface without the application shell. It uses a compact 64px brand masthead, a platform-access explanation, and one bounded connection form. The connection checks live inside the form so operational context stays attached to the action it describes. This is the one surface that centers content (`--container-max`) and permits the large headline exception in §3.
- The form owns only an HTTP(S) API origin and a masked API key. Credentials remain in memory only and are cleared on reload or sign-out. The connect action stays disabled until both values are valid and uses an explicit `Connecting…` busy state after submission.
- Connection status follows the public OmniWA GO contract: validate origin → verify the key with `GET /instance/all` → on HTTP 401/403 detect scoped access with `GET /instance/status`. The probe times out after 15 seconds. Errors render category, message, and `requestId` when present. The key is never rendered after a session is created.
- At tablet widths the explanation precedes the form in one flow; at phone widths the form comes first and the compact check strip is hidden. Every primary input/action stays ≥44px tall.

## 6. Shell & Navigation

The shell (`ShellV2`) is a two-column grid: a **224px** Panel-Canvas rail with a
subtle right border, plus a fluid, independently scrolling content area. Only
the rail's nav scrolls internally; the main area owns page scroll.

### Rail anatomy (top → bottom)

1. **Brand block** (`.ui-v2-shell__brand`, `min-height 72px`): the OmniWA logomark beside the app name (`OmniWA Console`, 13px/500) and the connected base URL (mono 10px, muted, truncated with a `title`).
2. **Context block** (`.ui-v2-shell__context`): the environment chip (Production / Staging / Self-hosted, colored border only), the key scope label (Admin / Instance / Unknown scope), a capability-discovery `<Status>` line, and the `GO {version}` mono line when known.
3. **Nav** (`.ui-v2-shell__nav`): scope-aware labeled sections (see below). Items are icon + label rows, `min-height 40px`, `10px` gap, 6px radius, secondary text; hover lifts to `fg 3%`; the active item takes Panel bg with a `--border-subtle` edge and primary text.
4. **Session footer** (`.ui-v2-shell__session`): a `Connected` status, an `In-memory credential` mono note, and the Sign-out action.

### Scope-aware navigation

Navigation is derived from the session key kind (`navigationForKeyKind`), not a
fixed list. There is **no global Settings item and no persistent Queue/Webhooks
entry** in the v2 shell.

- **Admin scope** → section **Platform**: Overview · Recovery *(only when the server advertises the `projection_failure_operations` capability)* · Instances.
- **Instance (API) scope** → **Runtime**: Overview · **Messaging**: Conversations, Groups, Campaigns · **Observability**: Events.
- **Unknown scope** → **Runtime**: Overview only.

### Page header

Each content page opens with a shared header (`.ui-v2-page-header`): an optional
10px uppercase eyebrow, the 22px/400 title, and optional supporting copy on the
left; connection state and at most one primary action on the right. Refresh and
pause are restrained secondary controls, not header actions. At ≤640px the
header stacks to a single column, context before actions, with 44px targets.
Workspace-style pages apply the same hierarchy to their internal thread header
instead of adding a global header.

### Responsive behavior

Primary target is desktop ≥1280px; the shell stays operable narrower without
changing information hierarchy.

| Range | Behavior |
| --- | --- |
| ≥901px | Full 224px rail; inspectors overlay content with a scrim |
| 641–900px | Rail collapses to a 64px icon-only column; every link keeps `title` + `aria-label`; scope status and sign-out stay reachable |
| 641–1024px | Metric grid wraps; tables scroll locally inside their wrapper |
| ≤640px | Brand + session move to a sticky top bar; nav becomes a fixed **bottom bar** with icon+label items; primary tables become continuous adaptive rows; inspectors/dialogs become bottom sheets |

Navigation touch targets are at least 44px; mobile controls use 44px where density permits.

## 7. Product Surfaces (v2)

These are the surfaces the v2 shell routes to today. Each follows the
table-first / inspector-detail pattern above unless noted.

### Overview (`platform-v2/OverviewPageV2`)

- The landing page for every scope. Scan order is fixed: health posture → six comparable persisted metrics → action-required state → bounded live-event state.
- Health uses a quiet bordered strip of dot + label states; platform and aggregate projection health stay separate from per-instance reads.
- The six comparable persisted metrics render in the bordered metric grid (§5) with URL-backed windows; missing values render `Not reported`, never zero. Action-required routes operators to resource panels and renders a neutral unavailable state rather than inferring an empty queue when no consolidated read exists.
- Live events render an explicit polling-only state (the browser does not open the admin-key WebSocket) and direct operators to durable instance event history.

### Recovery (`platform-v2/RecoveryPageV2`, admin + capability-gated)

- Appears only when the server advertises `projection_failure_operations`. A table-first surface for projection-failure operations; recovery actions stay separate from destructive actions and destructive actions use the typed-confirmation dialog.

### Instances (`instances-v2`)

- The lifecycle table is the primary surface: search, active filters, freshness, dense status scanning, right-aligned message counts, and cursor pagination.
- Opening an instance marks the row (restrained edge + text label) and presents the right-anchored inspector. Drawer hierarchy is fixed: identity + status → compact facts → QR pairing → lifecycle controls → sessions → provider capabilities.
- **QR pairing**: rendered on a white 12px-radius well (QR needs a light background) inside a Recessed container, with an expiry countdown (mono, muted amber under 10s) and a "Refresh QR" ghost button. Pairing renders as numbered dot + label steps `waiting → scanned → paired`; the UI never implies pairing completed before the lifecycle state confirms it.
- Recovery actions are separated from destructive actions; Disconnect and Destroy only launch the typed-confirmation pattern, never inline confirmation.

### Conversations (`conversations-v2` — the messaging workspace)

The workspace is the console's center of gravity and is full-bleed (no 24px page padding).

- **Three-pane layout on desktop**: conversation list (Panel bg) · conversation timeline (Canvas bg) · context panel (Panel bg, collapsible). The workspace fills the viewport; only the timeline scrolls vertically.
- At ≤900px it becomes a single-pane switcher: the selected thread is the default pane, with a back control to the directory; all mobile controls meet 44px.
- **Message bubbles** (`.ui-v2-message-list`): `width: min(76%, 640px)`, 12px radius, Recessed bg for inbound (left), an Earth-Gray-tinted Recessed bg for outbound (right). Selected bubble takes a `--border-strong` inset edge. Footer (11–12px, muted) shows timestamp + delivery status. Clicking a bubble opens its delivery timeline in the context panel; message actions live only there, never duplicated in the bubble.
- **Bubble status vocabulary** (dot + label): `accepted` / `queued` pending · `delivered` healthy · `failed` failed · `canceled` inactive. Never a bare double-check — words, not glyphs.
- **Composer**: Recessed bar with an auto-growing textarea, an attach ghost icon-button, and a Send primary that stays disabled until the trimmed message has content. When the instance is not connected the composer is replaced by a warning bar with a "Reconnect" action. Microcopy: sends are *accepted*; delivery shows on the bubble.
- The workspace serves direct chats only — groups are a management table, not a conversation surface.

### Groups (`groups-v2`)

- A bordered metric grid summarizing the group population, then a table-first workbench: search, active filters, result count, freshness, bulk selection, and cursor pagination on one continuous list.
- Every row exposes selection, group identity, member count, operator role, local state, and last activity, with status as dot + label.
- Selecting a group opens the shared right inspector; the table never reflows and closing restores focus to the selected row. Drawer hierarchy: identity + local state → compact facts → invite link → local-state controls → member management → one-off text command. Member and send commands render acceptance, never synchronous completion.

### Campaigns (`campaigns-v2`, route `/messages`)

- A table-first campaign workbench with search, active filters, result count, freshness, cursor pagination, and segmented lifecycle accounting; campaign detail opens in the shared inspector (`CampaignInspectorV2`).
- **Create flow** (`CreateCampaignV2`) enforces the public API's per-recipient JID and opt-in evidence contract (`consent.ts`); audience input is bound to backend consent enforcement, not to any local list concept.
- **Progress**: segments colored by outcome — delivered healthy, accepted and queued as distinct pending steps, failed, canceled inactive — with aligned mono counts. Never a single undifferentiated bar and never merge accepted into queued or delivered.
- **Campaign status vocabulary**: `draft` inactive · `scheduled` info · `running` pending (pulsing) · `paused` degraded · `completed` healthy · `aborted` failed.

### Events (`events-v2`)

- Event stream and Audit records are sibling modes of one table-first workbench, switched with the underline tabs (§5), keeping the active dataset, columns, and empty state explicit.
- A compact observability strip communicates stream state, newest-first ordering, the bounded 200-row presentation buffer, and freshness without competing with the header.
- Selecting an event opens a read-only right inspector; hierarchy is fixed: event identity + occurrence → normalized facts → correlation identifiers → safe normalized payload → stream provenance. Event facts never expose recovery or destructive actions.
- Live-tail language stays precise: new events prepend into the bounded buffer, Pause pauses presentation only, and Load older pages backward through `listEvents` cursors. Audit mode reuses the workbench with actor / action / outcome / request columns and shows an honest empty state when no records exist.

## 8. Do's and Don'ts

### Do

- Render every status as dot + label using the frozen vocabulary in §2 (via the `<Status>` primitive).
- Put every ID in mono with a copy affordance; surface `requestId` on every error.
- Use tabular numerals on all metrics and counts; render metric values in mono.
- Keep exactly one restrained Earth Gray primary action per view.
- Show async-accepted states honestly: "Accepted", "Queued" — never "Sent" until the delivery history says so.
- Reflect filters/cursors into the URL; every view is a shareable deep link.
- Derive navigation from the session scope; never hardcode a nav list that ignores key kind.

### Don't

- Don't use decorative gradients or glow.
- Don't use cold blue-tinted dark backgrounds.
- Don't signal with color alone, and don't invent status colors outside §2.
- Don't use weight 700+ or the unused display type scale; product type tops out at the 22px page title.
- Don't use shadows for elevation on base surfaces (luminance steps instead); reserve `--elev-raised` for floating inspectors and dialogs.
- Don't center-max-width product pages; they are full-bleed (Connect and the `/__ui-v2` gallery are the only centered surfaces).
- Don't render WhatsApp-green (`#25D366`) UI chrome. Muted green (`--ok`) is reserved for healthy/live/delivered status only.

## 9. Agent Prompt Guide

### Quick reference

- Canvas `#161412` · Panel `#1f1d1b` · Elevated `color-mix(in oklab, var(--surface), var(--fg) 4%)` · Recessed `color-mix(in oklab, var(--bg), black 12%)`
- Text `#faf9f6` / `#afaeac` / `#868584` / `#666469`
- Controls Earth Gray `#353534`; no saturated brand accent
- Status: muted semantic tokens `--ok/--pending/--degraded/--failed/--info/--inactive`; never reused as chrome
- Border `--border` `rgba(226,226,226,0.35)`; `--border-subtle` for dividers, `--border-strong` for focus/active edges
- Matter Regular 14px root / 13px controls; mono = Geist Mono / Matter Mono 12px; metric values 24px mono; max weight 500
- Radius: 6px inputs/nav/tables, 12px surfaces/dialogs/bubbles, 9999px buttons and pills
- Detail = right inspector `min(440px)` with a warm scrim; dialog = `min(520px)` centered; both become bottom sheets ≤640px

### Example component prompts

- "Build an instance table inside a `.ui-v2-table-wrap` scroller: `table-layout: fixed`, `min-width 620px`, 44px rows with `8px 12px` padding. Sticky 11px/400 uppercase Stone Gray headers with `1.4px` tracking; 13px Warm Parchment cells; `fg 4%` hover; status as muted dot + label. Collapse to label/value rows at ≤640px."
- "Metric grid cell: bordered contiguous grid on `--border-subtle`, `min-height 96px`, 12px padding. Label 10px/400 uppercase Stone Gray with `1.2px` tracking; value 24px/400 mono Warm Parchment with tabular numerals."
- "QR pairing block: Recessed container holding a 240px white well for the QR, expiry countdown in mono 12px turning muted amber under 10s, Earth Gray pill button below; numbered `waiting → scanned → paired` steps."

### Iteration guide

1. Start every screen from the shell (scope-aware rail + page header) — panels never float alone.
2. Reach for a table before a card grid; the bordered metric grid is the only card-like surface.
3. Apply the status vocabulary before styling anything else — it is the product's core language.
4. Check honesty last: accepted ≠ delivered, sample data labeled as sample, `requestId` visible on errors.

## Appendix A — Legacy v1 surfaces (not in the v2 shell)

The following surfaces exist in v1 feature code and/or the static prototypes in
`design/prototypes/` but are **not routed by the v2 shell** and are not part of
the current v2 contract. They are retained here as historical/reference designs.
Do not treat them as built v2 surfaces; if any is promoted into v2, move its
section into §7 and reconcile it with the shell and inspector patterns first.

- **Queue & Jobs workbench** — four-metric posture (depth, in-flight, retries, dead-lettered) over a jobs table with redrive/discard recovery. No v2 route or nav entry.
- **Webhooks delivery operations** — endpoint posture metrics + endpoint table with single/bulk redrive and typed-confirmation retirement. No v2 route or nav entry.
- **Settings command surface** — active-revision strip, read-only active values vs. validated draft activation, and the console-session (in-memory credential) panel. In v2 the in-memory credential and disconnect live in the shell session footer instead; there is no Settings route.
- **Admin API-key inventory** (`features/api-keys`) — full-width key table with show-once provision/rotation dialogs and typed-confirmation revocation. No v2 route.
- **Named Lists panel mode** — local operator grouping over Groups via a `?list=nl_*` deep link. OmniWA GO exposes no Named Lists API; production Groups must not create local lists. Retained only as visual research.
- **Instance-scoped tab template** — the historical breadcrumb + horizontal tab row (`Chats · Contacts · Labels · Groups · Messages`) under a page header. The v2 shell uses scope-aware global nav instead.

## Appendix B — Token reference

Canonical source: `src/styles/tokens.css`. Product code should reference tokens,
never raw literals. Base tokens (`--bg`, `--success`, `--space-4`, …) feed the
aliases (`--canvas`, `--ok`, …) that surfaces consume. The `--text-2xl …
--text-4xl` display scale is inherited from Warp and intentionally unused by the
console; do not introduce it into product surfaces.

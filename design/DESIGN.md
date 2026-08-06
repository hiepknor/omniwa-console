# OmniWA Console — Locked Design System

> Category: Operations & Infrastructure — WhatsApp platform operations console.
> **Status: frozen visual contract.** Canonical tokens live in
> `src/styles/index.css` (Tailwind v4 `@theme`), primitives live in `src/ui/`, and
> `/__ui` is the review surface. These three sources must change together; code
> does not silently override this contract.

## 0. One-paragraph brief

A **manga-inspired, dense operational console** — **black ink on white paper**,
editorial and typography-led. Everything is **square** — no rounded corners
anywhere. Surfaces are **flat**: hairline 1px borders and stepped light grays.
Only action lift and floating menus may use a crisp, zero-blur offset ink shadow;
only semantic status and danger treatments may use screentone gradients. Soft
shadows, decorative gradients, and blur are forbidden. The palette is **pure
monochrome** — ink, paper, and gray, with **no chroma at all**. Built
**Tailwind-first**.

## 1. Principles

1. **Square, always.** `border-radius: 0` globally (enforced in `@layer base`). No
   pills, no rounded avatars, no soft cards. Corners are hard.
2. **Flat, with explicit lift.** Borders and background steps carry ordinary
   elevation. A hard offset shadow is reserved for buttons and open menus; it is
   never soft, blurred, or used to turn content sections into floating cards.
3. **Ink on paper.** White paper, black ink, gray screentone for tone. A light
   surface, not dark.
4. **No chroma.** There are no colors — only ink, paper, and gray. Emphasis is an
   inverted ink block; status is screentone. Never introduce a hue.
5. **Typography leads.** Hierarchy comes from size/weight/letter-spacing and the
   sans/mono contrast — not from boxes and color.
6. **Dense.** Optimized for scanning tables and tracing state under pressure. Tight
   rows, small type, high information per screen.
7. **Honest state.** Status is always a mark **plus a label**, never color alone.
   `accepted` ≠ `delivered`; every error surfaces its `requestId`.

## 2. Color (`@theme` in `src/styles/index.css`)

### Paper surfaces (light)

| Token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `#ffffff` | Paper / page background |
| `--color-surface` | `#ffffff` | Panels, tables, rail, overlays |
| `--color-elevated` | `#f2f2f2` | Hover rows, action footers, notices |
| `--color-recessed` | `#f6f6f6` | Inputs, code/QR wells |
| `--color-line` | `#e2e2e2` | Default hairline divider (inner rows) |
| `--color-line-strong` | `#111111` | Ink frame of panels, focus, active edges |

### Ink tiers

| Token | Value | Role |
| --- | --- | --- |
| `--color-fg` | `#111111` | Primary ink — headings, cell values |
| `--color-fg-2` | `#565656` | Secondary — body, descriptions |
| `--color-fg-3` | `#6b6b6b` | Muted — AA-safe small labels, metadata, placeholders |

### No accent color

The interface has no chroma. `--color-accent` is ink `#111111` and the primary
action is an **inverted ink block** (`--color-accent-ink: #ffffff` text on ink).
The status tokens (`--color-ok / --warn / --danger`) all resolve to ink `#111111`;
they exist only so status code reads semantically — **status is distinguished by
screentone pattern, never by hue** (see `src/ui/Status.tsx`).

### Status vocabulary (the frozen set)

A status is a **24px minimum-height framed ink stamp**: a 20px recessed marker
cell, 10px screentone mark, and an explicit 11px/500 label. Atomic status labels
stay on one line so responsive tables scroll inside their own frame instead of
breaking words. Prose-like labels outside tables opt into `wrap`; those wrap
within their container. The frame keeps status visually stable in tables,
headers, inspectors, and dense trailing content. The fill pattern carries the
meaning:

| Status | Screentone |
| --- | --- |
| `ok` / `active` / `delivered` | solid ink |
| `info` / `live` | split horizontal ink |
| `pending` / `pairing` / `queued` | halftone dots |
| `degraded` / `retrying` | diagonal hatch |
| `failed` / `disconnected` / `dead` | ink block with a white slash (cancelled) |
| `neutral` / `retired` / `unknown` | hollow outline |

Pattern-only or color-only signaling is forbidden — the label always states the
status in words.

## 3. Typography

- **Sans** (`--font-sans`): Inter / system grotesque. UI text and headings.
- **Mono** (`--font-mono`): Geist Mono / system mono. **Every identifier** —
  instance IDs, request IDs, cursors, JIDs, versions, counts in dense contexts.

| Role | Size | Weight | Notes |
| --- | --- | --- | --- |
| Display / page title | 20–24px | 600 | One per page; tight tracking (`-0.02em`) |
| Section heading | 14px | 600 | Panel / drawer section titles |
| Body | 14px | 400 | Descriptions, forms, empty states |
| Table cell / dense UI | 13px | 400 | The console default |
| Metric value | 24px | 600 | **Mono**, tabular numerals |
| Label / table header | 11px | 500 | **Uppercase**, tracking `0.08em`, muted |
| Metadata / mono ID | 12px | 400 | Mono, secondary/muted |

Weights: 400 body, 500 labels, 600 buttons/headings/metrics. Uppercase is only
for ≤11px labels. Numbers that align vertically use `tabular-nums`.

## 4. Form, layout, and elevation

- **Corners:** 0 everywhere. **Borders:** 1px `--color-line`; `--color-line-strong`
  for focus/active.
- **Elevation:** stepped surfaces by default. Buttons may lift by 1px and grow a
  2–3px zero-blur offset shadow. Open selectors may use a 4px zero-blur offset
  shadow. Panels, drawers, dialogs, tables, and notices remain shadowless.
- **Patterns:** gradients are not decorative backgrounds. They are restricted to
  screentone status marks, progress indeterminate/failure tracks, the danger
  button at rest, and deterministic QR/sample fixtures. Danger hover clears the
  hatch and becomes solid ink.
- **Motion:** interaction transitions are 150ms, limited to color, border,
  shadow, and the property that actually moves (`translate`/`rotate`). All motion
  has a `motion-reduce` fallback.
- **Spacing:** Tailwind 4px scale. Dense rhythm — 8/12/16 within blocks, 24 between
  sections.
- **Focus:** a 1px `--color-line-strong` inset ring or a 2px `--color-accent`
  outline on `:focus-visible` — visible, square, never removed.
- **Full-bleed:** the app fills the viewport; content is not center-max-width'd
  (Connect is the one centered surface).

## 5. Core components (`src/ui/`)

- **Button** — square, 1px border, 13px/600, `h-9` desktop and `h-10` mobile.
  `primary` = ink fill + white label; `ghost` = paper + strong border; `danger` =
  diagonal hazard hatch at rest and a solid ink block on hover. Enabled buttons
  lift 1px with a hard offset shadow; active returns to the baseline. Busy is
  visibly marked and natively disabled. Button labels never shrink or clip;
  responsive action rows wrap or stack around their intrinsic width. One primary
  action per view.
- **IconButton / CloseButton** — secondary utility actions use an icon-only,
  fully framed square: 36×36px desktop and 40×40px mobile, with a canonical
  14px stroked glyph. Refresh, search/filter submission, compact Back, inspector
  disclosure, copy, clear/remove, pagination, and dismiss actions belong here.
  Rest is the ghost Button treatment and inherits the same hover lift, hard
  shadow, active return, keyboard focus, busy, and disabled behavior. Every
  IconButton has a specific accessible name and a matching tooltip on hover and
  keyboard focus. CloseButton is the semantic X/dismiss composition. Neither
  primitive rounds or stretches to match its container. Primary actions,
  commands, confirmations, cancellation, and destructive intent retain visible
  labels and never use IconButton.
- **Logo / Icon** — brand identity remains in `Logo`; every interface glyph is
  drawn by `Icon`. Icons use the canonical 12/14/18px sizes, 1.75px square-cap
  monochrome stroke, no emoji, text glyph, filled icon library, or feature-local
  SVG. Icons are decorative and never supply an accessible name themselves;
  icon-only controls require an explicit accessible name and tooltip. Visible
  labels remain the default for primary actions and server commands; secondary
  utility actions use IconButton, and the compact rail and pinned compact footer
  controls remain navigation-specific exceptions. Navigation uses
  `NavigationItemContent` so full rail, compact rail, and mobile bottom nav cannot
  drift independently.
  Connection uses the canonical chain-link glyph; Contacts uses the canonical
  contact-with-index-lines glyph; the browser-session utility uses the canonical
  key glyph. None reuses the instance-fleet server glyph.
- **Status** — the canonical framed ink stamp from §2. All usages share the
  screentone registry in `statusMarks.ts`; notices and feedback map their state
  vocabulary into the same marks instead of copying gradients. Failed status
  receives the strong frame; other tones use the default hairline frame.
  `<Status tone>` is single-line; `<Status tone wrap>` is reserved for explicit
  long state descriptions outside dense tables.
- **Input / Field** — recessed bg, 1px border, square, 13px; focus → strong border.
  Invalid → strong ink (`--color-line-strong`) border + 12px message below. Labels are 11px uppercase muted. Field descriptions and errors are linked with `aria-describedby`; errors set `aria-invalid`, and required state remains explicit.
- **Textarea / DateTimeInput** — use the same surface, border, focus, invalid,
  disabled, and mobile target language as Input. Textarea resizes vertically;
  DateTimeInput standardizes the browser's local date-time field surface.
- **FileUpload** — the only single-file chooser. Native file semantics remain
  available without exposing browser-default visual chrome. The square recessed
  frame always names the selected file and its local MIME/size metadata, with
  explicit Choose, Replace, and Clear actions. Empty, selected, invalid,
  required, and disabled states use the same Field and Button language. Upload
  transport, progress, validation, and server acknowledgement remain owned by
  the calling feature; selecting a file never implies it was uploaded.
- **Checkbox / Radio / Switch** — native choice semantics with fully custom
  square visuals. Checkbox and radio use a framed 16px ink mark; radio remains
  square by design. Switch uses a 36×20px square track with an ink/paper thumb
  and `role="switch"`. All include visible labels, keyboard focus, disabled
  treatment, and at least a 36/40px labeled hit area.
- **Select** — custom ARIA combobox/listbox, never the browser-native visual.
  Closed hover uses recessed paper + strong border without movement. Open state
  inverts the chevron cell. The active option is ink with a white label; selected
  state has a square marker that also inverts when active. Trigger and options are
  40px tall on mobile. Menus remain 4px from the trigger and flip/align at
  viewport edges; parent grid stretching must not change that gap.
- **Table** — the workhorse. `--color-surface` container, 1px border, no radius.
  Sticky 11px uppercase muted headers; 13px cells; hairline row dividers; row hover
  = `--color-elevated`. IDs mono; timestamps relative with ISO `title`; numeric
  right-aligned tabular. Cells retain a 44px minimum; the named `Td multiline`
  composition adds canonical 8px vertical padding when identity metadata or a
  status reason needs multiple lines. Reasons wrap below the short status and
  expand only that row vertically, while ordinary rows remain 44px. Horizontal
  overflow stays inside the table container; the page never scrolls sideways
  and rows never become floating cards. Responsive geometry is container-owned,
  not viewport-owned: at **≤640px table width** the header becomes visually
  hidden and every row becomes one contiguous labelled record grid; at
  **641–768px** only `essential` columns remain; at **769–960px** `supporting`
  columns return while `detail` stays hidden; above 960px the complete column
  set returns. Compact records restore all columns, including `supporting` and
  `detail`, so narrow screens do not lose facts. Every `Td` supplies its short
  `mobileLabel`; long values use anywhere wrapping inside the value track.
  Features assign semantic column priority but never declare table breakpoints.
  `supporting` and `detail` are limited to redundant or inspector-available
  facts; a sole health, permission, action, or outcome fact remains `essential`.
- **MetricGrid** — one contiguous bordered grid (not separate cards): hairline
  cell separators, 11px uppercase label, **24px mono** value. The default density
  wraps to one column on narrow screens so long textual values remain readable;
  the explicit `compact` density retains two columns for short numeric facts.
  Standalone grids own their complete frame; a `flush` grid delegates its top
  and left frame edges to a zero-padding Panel. A grid following another Panel
  body element uses `flush-after-content` to restore the separating top edge.
  Features never remove individual grid borders or override Panel padding with
  conflicting utilities.
- **Tabs** — underline tabs; 2px `--color-accent` underline on the active tab.
  A reported tab count uses the canonical CountBadge; feature code supplies only
  the number and never restyles that chip. The tab strip may scroll horizontally
  but always clips vertical overflow so it never becomes a nested vertical
  scroll target. One selected tab is in the sequential focus order; Left/Right
  wrap between tabs and Home/End move to the first/last tab while activating it.
  A known tab panel is associated through `aria-controls`/`aria-labelledby`.
- **Drawer (inspector)** — right panel, `min(440px,100%)`, paper surface, 1px
  strong left border, and a 60% ink scrim. Header = title + mono ID + square close
  cell. ≤640px becomes an 85dvh full-width bottom sheet. The body scrolls without
  moving the page. An optional contextual-action footer remains outside that
  scroll container, so the primary next action is visible without competing with
  destructive actions at the end of long inspector content.
- **ResponsiveInspector** — one shared inspector slot that measures its owning
  workspace rather than the browser viewport. At 1560px of available workspace
  width it docks as a non-modal 440px third column beside the 320px directory
  and a timeline of at least 800px. It uses `aside`/region semantics, has its own
  bounded scroll, and never renders a scrim, focus trap, or body scroll lock.
  Below that container threshold it mounts the canonical Drawer; ≤640px therefore
  retains the 85dvh bottom sheet. Conversation facts persist in the docked slot,
  selected Message facts replace them, and closing Message facts restores the
  Conversation inspector.
- **Dialog** — `min(560px,100%)`, paper surface, 1px strong frame, square close
  cell, bounded body, and elevated action footer over a 60% ink scrim. ≤640px
  docks to the bottom and gives footer actions equal 40px targets. Destructive
  dialogs require explicit intent; pending commands can lock dismissal. A
  one-time secret reveal also locks X, Escape, and scrim dismissal until the
  operator explicitly confirms storage or confirms discarding the reveal;
  copying alone is not treated as durable storage.
- **Toast** — bottom-right, `--color-elevated`, a 2px ink left edge,
  13px/500 title + 12px detail, and **always** the mono `requestId` on API errors.
  Accepted commands say `accepted` and auto-dismiss (6s); errors persist.
- **CountBadge / MetadataBadge** — CountBadge is the only non-interactive
  quantity chip: square, mono 11px with tabular numerals, `--color-recessed` bg,
  and a default hairline frame. Tabs and explicitly named count contexts pass a
  number to this primitive, so count-chip changes remain centralized. Ordinary
  table numbers, metrics, selection sentences, and operational Status labels do
  not become chips. MetadataBadge retains the same compact framed family for
  non-quantity facts such as an immutable version, without coupling their future
  treatment to count chips. Conversations with authoritative unread omit zero
  counts in dense directory rows and show positive counts there as accessible
  CountBadges. The selected header never repeats the attention badge; the
  inspector reports authoritative unread as a plain fact. Non-authoritative
  unread never renders a numeric badge; it uses the existing pending Status
  treatment with an explicit syncing label.
- **Conversation image lifecycle** — ready private JPEG/PNG content uses the
  shared framed Image primitive. Pending/processing and terminal unavailable
  states retain the message bubble and use a square bordered placeholder with
  the shared Status treatment; no provider URL or decorative image treatment is
  introduced. Capability-off uses that same placeholder; `not_ready` remains a
  pending state, and only the inspector may add a framed retry Button for a
  recoverable read. Timeline loading is near-viewport gated without changing
  geometry. Device upload uses the shared FileUpload inside the canonical Dialog
  and does not change the page frame.
- **Conversation message timeline** — the timeline uses the full detail pane so
  incoming and outgoing messages align to its opposite edges. Individual bubbles
  remain capped at `min(78%,42rem)` to preserve a readable line length; system
  and unknown directions use a centered neutral treatment. Every message exposes direction
  in its accessible name and visible metadata, chronological day changes insert
  hairline separators, and absent text says `Text content not reported` rather
  than displaying a backend token as content. Group messages never derive a
  sender from provider fields. When canonical Contact identity is available, an
  incoming Group `participantJid` may resolve only by exact match against a
  backend-reported Contact alias and displays that Contact's projected name.
  Unmatched, ambiguous, or unnamed identities say `Unknown participant`; raw
  identifiers remain inspector-only. Message controls derive their accessible name from the
  visible content, media state, direction, status, and time; a custom label may
  never hide visible failure or processing copy. Opening a newest cursor page
  anchors its scroll container to the end, including when its first data arrives after the route
  transition; older cursor pages start at their beginning. New items
  follow only while the operator remains near the end. Healthy Conversation and
  Messages projection status stays quiet; degraded or pending scope moves into
  the selected Conversation header. Only an authoritative
  newest timestamp moving forward counts as an append; projection backfill does
  not move the viewport. While the operator reads earlier history, appended items expose a compact `Latest messages` action
  instead of moving the explicit detail scroller, so review is never interrupted.
  Bounded-page pagination is a fixed detail footer immediately above Composer;
  it never overlays messages and remains absent for a fresh empty history. At
  mobile width its informational sentence stays accessible but visually hides,
  keeping both cursor actions in one compact row. A short newest page aligns its
  message lane to the bottom; older cursor pages remain top-aligned.
- **Conversation details and send availability** — the selected Conversation
  header keeps display identity, type, last activity, and a visible `Details`
  action when the inspector is not docked. The page header owns the single
  Refresh action and authoritative Conversation total; the directory starts
  directly with its sticky filter instead of repeating a list header. Unread attention
  stays in the directory; canonical and provider identifiers stay out of the
  primary timeline header. `Details` opens the canonical Drawer below the
  responsive-inspector threshold; at or above that threshold the same content
  remains visible as the third column. It groups backend-reported identity,
  provider routing, and projected state in framed Panels with DescriptionLists.
  Raw provider aliases and target JIDs remain inside that inspector rather than
  competing with message history on the primary surface. Conversation details
  and Message details are mutually exclusive URL-backed inspectors.
  A missing command target or send capability replaces the entire Composer form
  with one compact StateNotice, so an unavailable command never leaves a large
  disabled textarea occupying the workspace footer.
- **Conversation Composer** — the available send surface uses the selected
  header as its visible target context and the shared
  Textarea in auto-grow mode: one line initially, bounded to four lines before
  internal scrolling. The generic `Message` field, `Media…`, and `Send` actions share one
  bottom-aligned row at every viewport; mobile retains 40px action/control
  targets without reserving a three-row textarea. Command failure, cooldown,
  unknown outcome, recipient error, and provider acknowledgement remain above
  that row and may expand the footer only while reported. Auto-grow changes
  geometry only; its accessible name and Media dialog retain the selected
  Conversation name. It does not introduce Enter-to-send or change submission,
  capability, retry, or acknowledgement semantics. Dirty drafts confirm before
  route changes, pending and unknown outcomes keep the selected Conversation in
  place, and a pending navigation block resets once the Composer becomes clean.
- **DescriptionList / DescriptionItem** — the only repeated key/value facts
  treatment. It preserves native `dl`/`dt`/`dd` semantics, right-aligns dense
  values on wide screens, stacks them at ≤640px, wraps long content, and uses
  mono explicitly for identifiers. Features do not clone fact-row helpers.
  Copyable diagnostic identifiers compose the shared CopyValue action, which
  keeps the complete value visible and announces copy success or failure.
- **FilterToolbar / FilterChip** — the canonical list-filter frame and removable
  active-filter token. Toolbars wrap without horizontal page overflow; chips
  stay square, show label and value, and expose an explicit remove name. Filter
  controls and chips reflect URL state in product panels. A lone bounded control
  that affects only its owning Panel (for example metric window, density, or view
  mode) belongs in the Panel header actions instead of occupying a separate
  FilterToolbar row. Search/apply forms, multiple filters, and active chips stay
  in FilterToolbar.
- **SelectionBar** — the only bulk-selection header. It separates an explicitly
  named page scope from the cross-page selected total, owns none/partial/all
  checkbox state, and exposes one global Clear selection action. Counts use
  mono text rather than Status; Status remains reserved for operational state.
  Place SelectionBar directly above its canonical Table with one contiguous
  strong frame. Eligibility and other domain rules remain feature-owned.
- **SelectionReview** — the only retained-selection review surface when choices
  can span cursor pages. Beside a selectable table it lists only retained choices
  outside the current page; visible choices remain integrated into their table
  rows and are never duplicated below. It uses one bounded square frame, states
  the retained total through the canonical CountBadge without turning it into a
  status, keeps stable identity metadata visible, and gives every item an
  explicit Remove action. Domain status remains textual and blocked items sort
  first in the owning feature so a disabled submit never strands the operator.
- **Panel / StateNotice / CursorPagination** — the standard composition layer
  for framed sections, honest loading/empty/stale/error state, and cursor-based
  list progression. Panel headers place actions and a lone panel-scoped control
  beside the title on wide surfaces and stack them below the title when the
  Panel itself is ≤512px wide; this behavior is container-owned.
  Panel body spacing is selected through its named padding
  modes (`default`, `none`, or `compact-top`), never through a free-form body
  class escape hatch. API errors include normalized detail and `requestId` when
  present; pagination never suggests an unavailable page.
  Ordinary directories retain `First page` / `Load more`. A bounded Conversation
  history page overrides those labels with `Newest` / `Older messages` and says
  that one page is shown, because moving an opaque cursor replaces rather than
  appends the rendered history. The history pager stays at the bottom of a short
  timeline, disappears for a fresh ready history with no projected messages, and
  remains available on a cursor-addressed empty page so `Newest` can recover the
  operator to the current history.
  Healthy Conversation and Messages projection status stays quiet. Any
  differing, syncing, stale, not-ready, or failed state remains separately
  labelled in the selected Conversation header; quiet success never hides degraded
  observability.
- **ProgressBar** — an 8px square framed track with an ink fill and explicit
  text label. Determinate progress exposes its bounded numeric value;
  indeterminate progress uses the allowlisted diagonal operational screentone
  and says “In progress”; failure freezes at the last known value and uses the
  failure hatch. Never turn command acknowledgement into fake completion.
- **Image** — the only product-image frame. It owns square framing, aspect ratio
  (`square`, `video`, `wide`, or intrinsic), `cover`/`contain`, alt text, caption,
  deterministic loading, and unavailable/error fallback. QR pairing uses
  `contain` and a paper quiet zone. Features do not render raw `<img>` elements.
- **WorkspacePageFrame / SplitWorkspace / WorkspacePaneHeader** — the only
  full-height directory-detail composition. At 900px and wider the frame
  renders the canonical PageHeader with a 24px top inset, then an attached
  320px directory and fluid detail pane. Below 900px it replaces the full
  PageHeader with one edge-to-edge 57px compact bar: directory mode identifies the workspace;
  detail mode exposes a visible full Back action, truncated resource identity,
  optional short context, and contextual actions. The compact bar and sticky
  desktop pane header never appear together. The composition owns one boundary
  hairline, internal pane scrolling, focus entry/restoration, and footer space;
  production, preview, and `/__ui` use the same primitives.

## 6. Shell & navigation

- **Rail:** a fixed ~224px `--color-surface` column, 1px right border. Top: brand
  (logomark + `OmniWA Console` + base URL in mono 10px), then navigation without
  a runtime-context interruption. For instance scope, bottom is the separately
  framed, active-aware **Connection** destination. Admin and unknown scopes have
  no current runtime connection; their bottom cell is a **Session** utility that
  opens browser-session facts before offering `End Console session`. Connection
  and Session share the canonical framed Button geometry in this footer cell;
  Connection retains link semantics and an inverted active state, while Session
  retains button semantics and opens a dialog.
- **Console footer:** a persistent 40px status bar at the bottom of the main
  column, outside the page scroll container and never beneath the rail. It owns
  environment, credential scope, canonical capability-discovery Status, optional
  `GO {version}` with revision tooltip, and the `Memory-only` credential-lifetime
  note. It uses one top hairline, paper background, square geometry, and one row
  with two coherent edge-aligned clusters: runtime and scope on the left;
  capability, version, and credential lifetime on the right. Hairline separators
  establish hierarchy without nested surfaces. It never owns page actions, page
  progress, WhatsApp connection, filters, errors, acknowledgements, or inferred
  health. At 641–900px version and credential lifetime are hidden while runtime,
  scope, and capability remain visible; at 640px and below the complete footer is
  hidden so it cannot compete with bottom navigation.
- **Scope-aware nav** (from `navigationForKeyKind`): navigation is derived from the
  session key kind, not hardcoded.
  - **Admin** → *Platform*: Overview · Recovery (only when the server advertises
    `projection_failure_operations`) · Instances.
  - **API** → *Runtime*: Overview plus the pinned **Connection** destination ·
    *Messaging*: Conversations, Contacts, Groups, Campaigns · *Observability*: Events.
    Connection owns active-runtime identity, transport, pairing, lifecycle, and
    the explicit memory-only Console-session exit.
  - **Unknown** → *Runtime*: Overview.
- **Console session exit:** ending the Console session clears browser-memory
  credentials and query state, returns to Connect, and sends no server command.
  Instance scope exposes it in a separate `Console session` Panel on
  `/connection`; it never shares the WhatsApp lifecycle command group. Admin and
  unknown scopes expose the same facts and action in the Session dialog. The
  wording remains distinct: `Disconnect…` drops transport, `Log out WhatsApp…`
  unpairs WhatsApp, and `End Console session` clears only browser state.
- **Page header:** one compact semantic header with an optional 11px uppercase
  section label, one page title, concise goal-oriented description, a secondary
  action cluster, and at most one primary action. It never owns filters,
  selectors, metrics, global connection state, breadcrumbs, or feature status.
  At ≥641px actions align with the title while the description retains its own
  full row; at ≤640px DOM and visual order is section → title → description →
  actions. Actions wrap instead of overflowing, and the primary action remains
  last. The header keeps the paper background, hairline bottom rule, square
  geometry, 14px body copy, and existing Button interaction language.
  Full-height split workspaces do not shrink or restyle this primitive: their
  WorkspacePageFrame shows it only at 900px and wider and supplies the
  separately locked compact workspace bar at tablet/mobile widths.
- **Responsive:** ≥900px full rail; 640–899px icon-only rail; <640px a fixed
  bottom nav bar with icon + visible 10px label while the main viewport reserves
  its height. The instance-scoped Connection destination remains pinned outside
  the scrolling destination group at compact widths; admin/unknown Session stays
  a separately framed utility outside navigation. Both pinned footer controls
  collapse to the same icon-only framed control on compact tablet and mobile,
  retain explicit accessible names and tooltips, and use a 44px mobile target.
  Scrolling primary-navigation destinations keep their visible 10px mobile
  labels. Dense form/action controls are at least 40px on mobile; primary
  navigation targets remain at least 44px.
- **Split workspaces:** directory + detail use two panes at 900px and wider.
  Below 900px the selected detail replaces the directory and exposes a
  full `Back` action; neither pane may remain positioned outside the viewport.
  Conversations add the shared non-modal third inspector only when their actual
  workspace container reaches 1560px; desktop below that threshold, tablet, and
  mobile retain Drawer disclosure.
  Contacts intentionally does not use this two-pane recipe. It is a full-width
  responsive registry Table; selecting a row opens Contact detail in the shared
  Drawer. Labels are an on-demand, mutually exclusive utility Drawer with
  internal list/detail navigation. Contact and Label URL state remain
  independent, and the inactive Label projection is never fetched solely to
  populate navigation.
- **Feedback placement:** `SurfaceNotice` is the framed inline/workspace banner;
  `ToastViewport` is fixed bottom-right and becomes full inset-width on mobile.
  Its inline placement exists only for deterministic `/__ui` review. Toast
  timers pause on hover, focus, or hidden documents; errors persist.

## 7. Frozen interaction states

Every shared control ships and is reviewed in all applicable states. State
styles must be mutually exclusive; do not stack conflicting `text-*`, `bg-*`,
or `border-*` utilities and rely on generated CSS order.

| Primitive | Required visual states |
| --- | --- |
| PageHeader | title only, section + description, secondary actions, primary action, three-action wrap, long copy |
| Button | rest, hover, active, keyboard focus, disabled, busy |
| Select trigger | rest, hover, open, open + hover, keyboard focus, invalid, disabled |
| Select option | rest, active/hover, selected, active + selected, disabled |
| Input | rest, hover, keyboard focus, populated, invalid, disabled |
| Textarea / DateTimeInput | rest, populated, keyboard focus, invalid, disabled |
| FileUpload | empty, selected, replace, clear, keyboard focus, invalid, required, disabled |
| Checkbox / Radio / Switch | off, on, indeterminate, hover, keyboard focus, disabled |
| SelectionBar | zero, partial, all-page, cross-page total, disabled, clear, blocked composition |
| SelectionReview | hidden-empty, retained items, mixed statuses, long detail, remove, disabled, bounded overflow |
| Filter chip | rest, hover, keyboard focus, removed |
| Table row | rest, hover, keyboard focus, selected, multiline status + reason |
| Table layout | compact labelled records, narrow essentials, regular supporting facts, wide full columns, long wrapping |
| StateNotice | info/stale, loading, empty/not-ready, error + requestId, action |
| CursorPagination | first page, next cursor, final page, responsive stacking |
| ProgressBar | 0–99%, indeterminate, complete, failed at last known value |
| Image | loading, ready, contain/cover, long caption, missing/error fallback |
| Shell navigation | 224px full rail, 64px icon rail, fixed mobile bottom nav, pinned instance Connection, admin/unknown Session utility + dialog |
| Console footer | ready capabilities, discovery pending, discovery failure, version absent, compact tablet, hidden mobile |
| Workspace page / split workspace | PageHeader + two panes ≥900px, optional third inspector at ≥1560px container width, compact directory bar, compact detail bar + Back, long title, contextual busy action <900px, newest/older scroll alignment |
| Contacts workspace | full-width responsive registry table, Contacts ready/search/pagination/detail Drawer, Label catalog closed/open/list/detail Drawer, independent capability unavailable, projection non-ready/stale/error, compact labelled records |
| Workflow forms | Create Campaign and Create/Edit Group List two-column desktop composition, single-column mobile composition, target table/selection, readiness, validation copy, responsive footer actions |
| Feedback placement | surface banner, persistent error toast, dismiss, paused timer |
| Dialog / Drawer / responsive inspector | 1920px docked third column, 1440px desktop Drawer, tablet Drawer, 390px bottom sheet, bounded scroll, pending-close, one-time-secret dismissal, Conversation/Message replacement |

Hover never hides a label or icon. Inverted surfaces always use paper-colored
foregrounds. Motion may reinforce state, but color/border/fill must communicate
the same state when reduced motion is enabled. Touch devices do not depend on
hover to expose meaning or actions.

### Implementation recipes

`/__ui` is the executable reference for five complete compositions, not merely
a parts bin:

1. **List:** filter toolbar → active chips → honest projection state → table →
   cursor pagination. Loading, empty, stale/syncing, not-ready, error, and ready
   are mutually exclusive render paths in product panels.
2. **Inspector:** selection → responsive docked column or Drawer → identity/status → DescriptionList → only
   the narrow actions owned by that panel. Fact groups and action groups use
   canonical framed Panel surfaces rather than floating directly in the Drawer
   body. Long identifiers remain fully available with the shared copy action;
   long content remains independently scrollable.
3. **Command:** consequence notice → required fields/confirmation → explicit
   readiness review → stable footer. Duplicate submission is disabled; pending
   commands lock dismissal; dirty editors confirm destructive navigation;
   acknowledgement never claims downstream delivery. Multi-page replacement
   editors report honest loading state rather than fabricating determinate
   progress from an atomic query.
4. **Recovery:** normalized error with request ID → explicit review → danger
   intent → refreshed narrow projection. It never infers success from aggregate
   health.
5. **Split workspace:** directory → selection → detail with sticky identity →
   narrow footer action. Above 900px both panes remain visible; an actual
   workspace width of 1560px adds the Conversation inspector as a third column.
   At tablet/mobile the detail replaces the directory and exposes Back.

Production work should start from one of these recipes and delete inapplicable
pieces, rather than inventing new local frames or interaction language.

Preview routes are deterministic integration fixtures, not a second design
source. They must render the production route view and shared composition
primitives. Fixture-only inspector content may model server states without
network hooks, but it may not recreate a shared frame, filter toolbar, state
notice, image treatment, split workspace, drawer, or dialog visual language.
Fixture state combinations must also be contract-valid: for example a paired
instance cannot simultaneously display an active pairing QR.

## 8. Change control

The visual language is locked. A deliberate change requires all of the
following in one pull request:

1. Update this contract when tokens, geometry, elevation, interaction states, or
   an allowlisted exception changes.
2. Update or add the production primitive in `src/ui/`; features do not invent a
   competing control.
3. Add the state to `/__ui` using the production primitive.
4. Add a regression test, `scripts/check-design.mjs` interaction rule, or
   `scripts/check-visual-language.mjs` visual-boundary rule that fails before the
   change and protects the decision afterward.
5. Record Chrome DevTools evidence at desktop and 390px mobile, including hover,
   focus, open, disabled/pending, and overflow behavior as applicable.

Allowlist changes in `scripts/check-visual-language.mjs` require a matching
rationale in this document. A screenshot alone does not authorize a new token,
hue, shadow, gradient, blur, radius, or feature-local primitive.

## 9. Do / Don't

**Do:** keep every corner square; render status as mark + label; put every ID in
mono; use tabular numerals on data; keep one primary action per view; say
`accepted`/`queued` honestly; reflect filters/cursors into the URL; derive nav from
scope.

**Don't:** add any `border-radius`, soft shadow, decorative gradient, or blur;
introduce any hue or chroma; use hard shadows outside buttons/open menus; signal
with pattern or color alone; stack conflicting state-color utilities; use weight
700+; center-max-width product pages.

## 10. Agent quick reference

- Paper `#ffffff` / `#f2f2f2` / `#f6f6f6`; lines `#e2e2e2` (inner) / `#111111` (ink frame).
- Ink `#111111 / #565656 / #6b6b6b`. No chroma; small muted text remains AA-safe.
- Primary = inverted ink block; status = screentone (§2), never hue.
- Everything square, dense, light, and framed with 1px borders. Only buttons and
  open menus receive hard zero-blur lift; overlays remain flat.
- Sans 13–14px UI, mono 12px IDs + 24px metrics; labels 11px uppercase.
- Build with Tailwind utilities against the `@theme` tokens; compose `src/ui/`
  primitives before writing bespoke markup.
- Review every state in §7; update the contract, gallery, tests, and gates
  together when intentionally changing the language.

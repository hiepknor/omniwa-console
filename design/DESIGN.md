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
- **CloseButton** — the only icon-only X/dismiss control. It is a fully framed
  square: 36×36px desktop and 40×40px mobile, with a 14px stroked X. Rest is
  the ghost Button treatment and it inherits the same hover lift, hard shadow,
  active return, keyboard focus, and disabled behavior. It never rounds or
  stretches to match its container. Dialogs, drawers, and notifications all use
  this primitive with an explicit non-visual accessible label.
- **Logo / Icon** — brand identity remains in `Logo`; every interface glyph is
  drawn by `Icon`. Icons use the canonical 12/14/18px sizes, 1.75px square-cap
  monochrome stroke, no emoji, text glyph, filled icon library, or feature-local
  SVG. Icons are decorative and never replace a visible label; icon-only actions
  require an explicit accessible name. Navigation uses `NavigationItemContent`
  so full rail, compact rail, and mobile bottom nav cannot drift independently.
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
  right-aligned tabular. Horizontal overflow stays inside the table container;
  the page never scrolls sideways and rows never become floating cards.
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
- **Drawer (inspector)** — right panel, `min(440px,100%)`, paper surface, 1px
  strong left border, and a 60% ink scrim. Header = title + mono ID + square close
  cell. ≤640px becomes an 85dvh full-width bottom sheet. The body scrolls without
  moving the page.
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
- **Badge** — square count chip, mono 11px, `--color-recessed` bg.
- **DescriptionList / DescriptionItem** — the only repeated key/value facts
  treatment. It preserves native `dl`/`dt`/`dd` semantics, right-aligns dense
  values on wide screens, stacks them at ≤640px, wraps long content, and uses
  mono explicitly for identifiers. Features do not clone fact-row helpers.
- **FilterToolbar / FilterChip** — the canonical list-filter frame and removable
  active-filter token. Toolbars wrap without horizontal page overflow; chips
  stay square, show label and value, and expose an explicit remove name. Filter
  controls and chips reflect URL state in product panels.
- **Panel / StateNotice / CursorPagination** — the standard composition layer
  for framed sections, honest loading/empty/stale/error state, and cursor-based
  list progression. Panel body spacing is selected through its named padding
  modes (`default`, `none`, or `compact-top`), never through a free-form body
  class escape hatch. API errors include normalized detail and `requestId` when
  present; pagination never suggests an unavailable page.
- **ProgressBar** — an 8px square framed track with an ink fill and explicit
  text label. Determinate progress exposes its bounded numeric value;
  indeterminate progress uses the allowlisted diagonal operational screentone
  and says “In progress”; failure freezes at the last known value and uses the
  failure hatch. Never turn command acknowledgement into fake completion.
- **Image** — the only product-image frame. It owns square framing, aspect ratio
  (`square`, `video`, `wide`, or intrinsic), `cover`/`contain`, alt text, caption,
  deterministic loading, and unavailable/error fallback. QR pairing uses
  `contain` and a paper quiet zone. Features do not render raw `<img>` elements.
- **SplitWorkspace / WorkspacePaneHeader** — the only directory-detail frame.
  It owns the 320px directory column, internal pane scrolling, the 900px
  single-pane breakpoint, and the sticky pane header. Production and preview
  routes use the same primitive; detail mode on tablet/mobile must expose a
  visible Back action supplied by the feature.

## 6. Shell & navigation

- **Rail:** a fixed ~224px `--color-surface` column, 1px right border. Top: brand
  (logomark + `OmniWA Console` + base URL in mono 10px). Then a context block
  (environment, key scope, capability status, `GO {version}`). Then the nav. Bottom:
  a session footer (connection status + in-memory-credential note + Sign out).
- **Scope-aware nav** (from `navigationForKeyKind`): navigation is derived from the
  session key kind, not hardcoded.
  - **Admin** → *Platform*: Overview · Recovery (only when the server advertises
    `projection_failure_operations`) · Instances.
  - **API** → *Runtime*: Overview, Instance · *Messaging*: Conversations, Groups,
    Campaigns · *Observability*: Events. Instance is the stable destination for
    active-runtime identity and lifecycle; connection and pairing are sections,
    not navigation categories.
  - **Unknown** → *Runtime*: Overview.
- **Page header:** an optional 11px uppercase eyebrow, the page title, connection
  state on the right, at most one primary action. ≤640px stacks to one column.
- **Responsive:** ≥901px full rail; 641–900px icon-only rail; ≤640px a fixed
  bottom nav bar with icon + visible 10px label while the main viewport reserves
  its height. At compact widths Sign out is a separately framed session utility,
  never a navigation destination. Dense form/action controls are at least 40px
  on mobile; primary navigation targets remain at least 44px.
- **Split workspaces:** directory + detail use two panes only above 900px. At
  tablet/mobile widths the selected detail replaces the directory and exposes a
  full `Back` action; neither pane may remain positioned outside the viewport.
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
| Button | rest, hover, active, keyboard focus, disabled, busy |
| Select trigger | rest, hover, open, open + hover, keyboard focus, invalid, disabled |
| Select option | rest, active/hover, selected, active + selected, disabled |
| Input | rest, hover, keyboard focus, populated, invalid, disabled |
| Textarea / DateTimeInput | rest, populated, keyboard focus, invalid, disabled |
| Checkbox / Radio / Switch | off, on, hover, keyboard focus, disabled |
| Filter chip | rest, hover, keyboard focus, removed |
| Table row | rest, hover, keyboard focus, selected |
| StateNotice | info/stale, loading, empty/not-ready, error + requestId, action |
| CursorPagination | first page, next cursor, final page, responsive stacking |
| ProgressBar | 0–99%, indeterminate, complete, failed at last known value |
| Image | loading, ready, contain/cover, long caption, missing/error fallback |
| Shell navigation | 224px full rail, 64px icon rail, fixed mobile bottom nav |
| Split workspace | two panes >900px, directory or detail + Back ≤900px |
| Feedback placement | surface banner, persistent error toast, dismiss, paused timer |
| Dialog / Drawer | desktop, 390px mobile, bounded scroll, pending-close, one-time-secret dismissal |

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
2. **Inspector:** selection → Drawer → identity/status → DescriptionList → only
   the narrow actions owned by that panel. Fact groups and action groups use
   canonical framed Panel surfaces rather than floating directly in the Drawer
   body. Long identifiers remain fully available in the body even when repeated
   as a compact header subtitle. Long content remains body-scrollable.
3. **Command:** consequence notice → required fields/confirmation → stable
   footer. Duplicate submission is disabled; pending commands lock dismissal;
   acknowledgement never claims downstream delivery.
4. **Recovery:** normalized error with request ID → explicit review → danger
   intent → refreshed narrow projection. It never infers success from aggregate
   health.
5. **Split workspace:** directory → selection → detail with sticky identity →
   narrow footer action. Above 900px both panes remain visible; at tablet/mobile
   the detail replaces the directory and exposes Back.

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

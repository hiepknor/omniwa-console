# OmniWA Console — Design System (v3)

> Category: Operations & Infrastructure — WhatsApp platform operations console.
> A ground-up rebuild. This document is the brand contract. Canonical tokens live
> in `src/styles/index.css` (Tailwind v4 `@theme`); the primitives in `src/ui/`
> are the implementation source of truth. Where doc and code disagree, code wins.

## 0. One-paragraph brief

A **manga-inspired, dense operational console** — **black ink on white paper**,
editorial and typography-led. Everything is **square** — no rounded corners
anywhere. Surfaces are **flat**: hairline 1px borders, no shadows, no gradients,
no blur; depth comes from stepping light grays. The palette is **pure monochrome**
— ink, paper, and gray **screentone**, with **no chroma at all**. Meaning is
carried by ink weight, fill, and screentone pattern, never by hue. Built
**Tailwind-first**.

## 1. Principles

1. **Square, always.** `border-radius: 0` globally (enforced in `@layer base`). No
   pills, no rounded avatars, no soft cards. Corners are hard.
2. **Flat, not floating.** 1px borders (`--color-line`) and background steps carry
   elevation. No `box-shadow`, no gradients, no backdrop blur.
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
| `--color-surface` | `#ffffff` | Panels, tables, rail |
| `--color-elevated` | `#f2f2f2` | Hover rows, drawers, dialogs, menus |
| `--color-recessed` | `#f6f6f6` | Inputs, code/QR wells |
| `--color-line` | `#e2e2e2` | Default hairline divider (inner rows) |
| `--color-line-strong` | `#111111` | Ink frame of panels, focus, active edges |

### Ink tiers

| Token | Value | Role |
| --- | --- | --- |
| `--color-fg` | `#111111` | Primary ink — headings, cell values |
| `--color-fg-2` | `#565656` | Secondary — body, descriptions |
| `--color-fg-3` | `#8c8c8c` | Muted — labels, metadata, placeholders |

### No accent color

The interface has no chroma. `--color-accent` is ink `#111111` and the primary
action is an **inverted ink block** (`--color-accent-ink: #ffffff` text on ink).
The status tokens (`--color-ok / --warn / --danger`) all resolve to ink `#111111`;
they exist only so status code reads semantically — **status is distinguished by
screentone pattern, never by hue** (see `src/ui/Status.tsx`).

### Status vocabulary (the frozen set)

A status is an **8px screentone mark + label**. The fill pattern carries the
meaning:

| Status | Screentone |
| --- | --- |
| `ok` / `active` / `delivered`, `info` / `live` | solid ink |
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

Weights: 400 body, 500 labels/buttons, 600 headings/metrics. Uppercase is only
for ≤11px labels. Numbers that align vertically use `tabular-nums`.

## 4. Form & layout

- **Corners:** 0 everywhere. **Borders:** 1px `--color-line`; `--color-line-strong`
  for focus/active. **Elevation:** background step only.
- **Spacing:** Tailwind 4px scale. Dense rhythm — 8/12/16 within blocks, 24 between
  sections.
- **Focus:** a 1px `--color-line-strong` inset ring or a 2px `--color-accent`
  outline on `:focus-visible` — visible, square, never removed.
- **Full-bleed:** the app fills the viewport; content is not center-max-width'd
  (Connect is the one centered surface).

## 5. Core components (`src/ui/`)

- **Button** — square, 1px border, 13px/500, `h-9` dense. `primary` = flat
  `--color-accent` fill + white ink; `ghost` = transparent + `--color-line` border,
  hover lifts to `--color-elevated` + `--color-line-strong`; `danger` = a diagonal
  hazard-hatch fill that inverts to a solid ink block on hover (no hue). One primary per view.
- **Status** — 6px square mark + label; tones map to §2. `<Status tone>`.
- **Input / Field** — recessed bg, 1px border, square, 13px; focus → strong border.
  Invalid → strong ink (`--color-line-strong`) border + 12px message below. Labels are 11px uppercase muted.
- **Select** — ghost control with a chevron; active filters become dismissible
  square chips in the toolbar.
- **Table** — the workhorse. `--color-surface` container, 1px border, no radius.
  Sticky 11px uppercase muted headers; 13px cells; hairline row dividers; row hover
  = `--color-elevated`. IDs mono; timestamps relative with ISO `title`; numeric
  right-aligned tabular. Locally bounded horizontal scroll; the page never scrolls
  sideways. ≤640px rows become label/value stacks — never floating cards.
- **MetricGrid** — one contiguous bordered grid (not separate cards): hairline
  cell separators, 11px uppercase label, **24px mono** value. Wraps to 2→1 columns.
- **Tabs** — underline tabs; 2px `--color-accent` underline on the active tab.
- **Drawer (inspector)** — detail opens as a right panel, `min(440px,100%)`,
  `--color-surface`, 1px left border, over a `rgba(0,0,0,0.6)` scrim. Header =
  title + mono ID + close. ≤640px → full-width bottom sheet.
- **Dialog** — `min(520px,100%)`, `--color-elevated`, 1px `--color-line-strong`
  border, centered over a scrim. Destructive dialogs require typing the resource
  name; confirm stays disabled until it matches.
- **Toast** — bottom-right, `--color-elevated`, a 2px ink left edge,
  13px/500 title + 12px detail, and **always** the mono `requestId` on API errors.
  Accepted commands say `accepted` and auto-dismiss (6s); errors persist.
- **Badge** — square count chip, mono 11px, `--color-recessed` bg.

## 6. Shell & navigation

- **Rail:** a fixed ~224px `--color-surface` column, 1px right border. Top: brand
  (logomark + `OmniWA Console` + base URL in mono 10px). Then a context block
  (environment, key scope, capability status, `GO {version}`). Then the nav. Bottom:
  a session footer (connection status + in-memory-credential note + Sign out).
- **Scope-aware nav** (from `navigationForKeyKind`): navigation is derived from the
  session key kind, not hardcoded.
  - **Admin** → *Platform*: Overview · Recovery (only when the server advertises
    `projection_failure_operations`) · Instances.
  - **API** → *Runtime*: Overview · *Messaging*: Conversations, Groups, Campaigns ·
    *Observability*: Events.
  - **Unknown** → *Runtime*: Overview.
- **Page header:** an optional 11px uppercase eyebrow, the page title, connection
  state on the right, at most one primary action. ≤640px stacks to one column.
- **Responsive:** ≥901px full rail; 641–900px icon-only rail; ≤640px a fixed
  bottom nav bar. Touch targets ≥44px.

## 7. Do / Don't

**Do:** keep every corner square; render status as mark + label; put every ID in
mono; use tabular numerals on data; keep one primary action per view; say
`accepted`/`queued` honestly; reflect filters/cursors into the URL; derive nav from
scope.

**Don't:** add any `border-radius`, shadow, gradient, or blur; introduce any hue or
chroma (the palette is ink + paper + gray only); signal with pattern or color alone
(always label); use weight 700+; center-max-width product pages.

## 8. Agent quick reference

- Paper `#ffffff` / `#f2f2f2` / `#f6f6f6`; lines `#e2e2e2` (inner) / `#111111` (ink frame).
- Ink `#111111 / #565656 / #8c8c8c`. No chroma.
- Primary = inverted ink block; status = screentone (§2), never hue.
- Everything square (radius 0), flat (1px borders, no shadow), dense, light.
- Sans 13–14px UI, mono 12px IDs + 24px metrics; labels 11px uppercase.
- Build with Tailwind utilities against the `@theme` tokens; compose `src/ui/`
  primitives before writing bespoke markup.

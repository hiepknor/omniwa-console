# OmniWA Console — Design System (v3)

> Category: Operations & Infrastructure — WhatsApp platform operations console.
> A ground-up rebuild. This document is the brand contract. Canonical tokens live
> in `src/styles/index.css` (Tailwind v4 `@theme`); the primitives in `src/ui/`
> are the implementation source of truth. Where doc and code disagree, code wins.

## 0. One-paragraph brief

A **dark-only, dense operational console** with an **editorial, typography-led**
character and a **comic** streak. Everything is **square** — no rounded corners
anywhere. Surfaces are **flat**: hairline 1px borders, no shadows, no gradients,
no blur; depth comes from stepping the grayscale background. The palette is
**grayscale plus a few bold comic accents** used only for meaning (primary action
and status). Built **Tailwind-first**.

## 1. Principles

1. **Square, always.** `border-radius: 0` globally (enforced in `@layer base`). No
   pills, no rounded avatars, no soft cards. Corners are hard.
2. **Flat, not floating.** 1px borders (`--color-line`) and background steps carry
   elevation. No `box-shadow`, no gradients, no backdrop blur.
3. **Grayscale first.** The interface is near-black → near-white. Color is a
   signal, never decoration.
4. **Comic accents, sparingly.** Bold, saturated, flat fills — one primary accent
   plus the status hues. Never blend, tint, or gradient them.
5. **Typography leads.** Hierarchy comes from size/weight/letter-spacing and the
   sans/mono contrast — not from boxes and color.
6. **Dense.** Optimized for scanning tables and tracing state under pressure. Tight
   rows, small type, high information per screen.
7. **Honest state.** Status is always a mark **plus a label**, never color alone.
   `accepted` ≠ `delivered`; every error surfaces its `requestId`.

## 2. Color (`@theme` in `src/styles/index.css`)

### Grayscale surfaces (dark)

| Token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `#0a0a0a` | Canvas / page background |
| `--color-surface` | `#141414` | Panels, tables, rail |
| `--color-elevated` | `#1c1c1c` | Hover rows, drawers, dialogs, menus |
| `--color-recessed` | `#050505` | Inputs, code/QR wells |
| `--color-line` | `#262626` | Default hairline border / divider |
| `--color-line-strong` | `#3d3d3d` | Focus, active/selected edges |

### Text tiers

| Token | Value | Role |
| --- | --- | --- |
| `--color-fg` | `#f5f5f5` | Primary — headings, cell values |
| `--color-fg-2` | `#a3a3a3` | Secondary — body, descriptions |
| `--color-fg-3` | `#6b6b6b` | Muted — labels, metadata, placeholders |

### Comic accents (meaning only)

| Token | Value | Role |
| --- | --- | --- |
| `--color-accent` | `#0a84ff` | Primary action, links, `info`/streaming |
| `--color-ok` | `#30d158` | ok / connected / delivered / active |
| `--color-warn` | `#ffcc00` | pending / pairing / queued / degraded |
| `--color-danger` | `#ff3b30` | failed / disconnected / dead / destructive |

Accents render as **flat fills at full saturation** (comic ink), on the accent's
own ink (`--color-accent-ink: #fff`) or straight on the dark canvas. Never mix a
grayscale surface with a tinted accent surface — a colored element is either the
accent color or it is grayscale.

### Status vocabulary (the frozen set)

`ok` green · `pending` yellow · `degraded` yellow · `failed` red · `info`/`live`
blue · `neutral`/`retired` grayscale. A status is a **6px square mark + label**.
Color-only signaling is forbidden.

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
  hover lifts to `--color-elevated` + `--color-line-strong`; `danger` = red text +
  red border, filled red only inside typed-confirmation dialogs. One primary per view.
- **Status** — 6px square mark + label; tones map to §2. `<Status tone>`.
- **Input / Field** — recessed bg, 1px border, square, 13px; focus → strong border.
  Invalid → red border + 12px red message. Labels are 11px uppercase muted.
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
- **Toast** — bottom-right, `--color-elevated`, a 2px status-colored left edge,
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

**Don't:** add any `border-radius`, shadow, gradient, or blur; tint or blend accent
colors; signal with color alone; introduce a status color outside §2; use weight
700+; center-max-width product pages; render WhatsApp-green chrome (green is the
`ok` status only).

## 8. Agent quick reference

- Surfaces `#0a0a0a / #141414 / #1c1c1c / #050505`; lines `#262626` / `#3d3d3d`.
- Text `#f5f5f5 / #a3a3a3 / #6b6b6b`.
- Accent `#0a84ff`; status `#30d158 / #ffcc00 / #ff3b30`.
- Everything square (radius 0), flat (1px borders, no shadow), dense.
- Sans 13–14px UI, mono 12px IDs + 24px metrics; labels 11px uppercase.
- Build with Tailwind utilities against the `@theme` tokens; compose `src/ui/`
  primitives before writing bespoke markup.

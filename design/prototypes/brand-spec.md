# OmniWA Console navigation · Warp binding

The system uses a warm near-black base, Matter Regular, and a Parchment/Ash/Stone hierarchy. Interaction is expressed through Frosted Veil, Mist Border, and Earth Gray instead of accent colors.

## Core tokens

```css
--bg: oklch(19.28% 0.0051 67.52);
--surface: oklch(23.22% 0.0049 67.58);
--fg: oklch(98.20% 0.0041 91.45);
--muted: oklch(61.73% 0.0019 67.79);
--border: oklch(91.28% 0 89.88 / 35%);
--accent: oklch(32.86% 0.0017 106.49);
```

## Type stacks

- Display: `Matter Regular`, `Matter`, `Inter`, system sans-serif
- Body: `Matter Regular`, `Matter`, `Inter`, system sans-serif
- Mono: `Geist Mono`, `Matter Mono Regular`, system monospace

## Observed posture

- Almost monochromatic; no saturated accents, gradients, glow, or glass effects.
- Section labels are uppercase with wide tracking; headlines and navigation use weight 400, with 500 reserved for emphasis.
- The desktop sidebar is 224px wide; cards and controls use Frosted Veil and Mist Border instead of shadows.
- Settings is a contained utility destination above the session footer: a
  52px row with a 28px recessed icon well, primary label, quiet workspace
  context, and trailing disclosure. It collapses back to the standard nav
  item treatment on the rail and mobile bar.
- Active, hover, and focus states adjust luminance and opacity within the same warm palette.
- Rail and mobile layouts retain thin-stroke icons, clear labels, and interaction targets of at least 44px.

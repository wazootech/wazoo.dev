# Brand Guidelines

> Official Wazoo visual identity, color, typography, motion, and design assets.

Source: https://wazoo.dev/brand/

A living reference for Wazoo's visual identity — colors, typography, motion, and design assets.

This page serves as a unified system specification. For automated coding assistants and agents, Wazoo maintains a machine-readable [DESIGN.md](https://wazoo.dev/DESIGN.md) at the root of the project.

## Quick reference

| Token | Value |
| --- | --- |
| Primary | `#FF8C00` |
| Background | `#040404` |
| Text | `#B0B0B1` |
| Font (body) | IBM Plex Mono |
| Font (headings) | Inter |

## Usage policy

All brand assets are the exclusive property of Wazoo. Use of these assets does not grant any intellectual property rights. Contact the Wazoo team for partnership or licensing inquiries.

## Colors

Official color tokens, palette, and usage rules.

### Primary

| Token | Hex | RGB | Use |
| --- | --- | --- | --- |
| `primary` | `#FF8C00` | rgb(255, 140, 0) | Primary brand accent; CTAs, links, hover states |
| `primary-light` | `#FFB74D` | rgb(255, 183, 77) | Light mode primary |
| `primary-dark` | `#F57C00` | rgb(245, 124, 0) | Dark/active states |

**Primary**#FF8C00

**Primary Light**#FFB74D

**Primary Dark**#F57C00

### Background

| Token | Hex | RGB | Use |
| --- | --- | --- | --- |
| `void` | `#040404` | rgb(4, 4, 4) | Default dark background |
| `surface` | `#0F0F0F` | rgb(15, 15, 15) | Cards, panels, elevated surfaces |
| `light-bg` | `#F7F2E8` | rgb(247, 242, 232) | Default light background |

**Void**#040404

**Surface**#0F0F0F

**Light BG**#F7F2E8

### Text

| Token | Hex | RGB | Use |
| --- | --- | --- | --- |
| `text` | `#B0B0B1` | rgb(176, 176, 177) | Body copy on dark backgrounds |
| `text-muted` | `#7C7C7C` | rgb(124, 124, 124) | Secondary text, captions |
| `white` | `#FFFFFF` | rgb(255, 255, 255) | Headings, high-contrast text |
| `text-dark` | `#1F1B14` | rgb(31, 27, 20) | Body copy on light backgrounds |

**Text**#B0B0B1

**Text Muted**#7C7C7C

**Text Dark**#1F1B14

### Accents

| Token | Hex | RGB | Use |
| --- | --- | --- | --- |
| `highlight` | `#FFAA00` | rgb(255, 170, 0) | Highlight badges, quirky highlight |
| `selection` | `#846CE4` | rgb(132, 108, 228) | Text selection background |

### Logo gradient

The W mark inside the Worlds logo uses a layered semi-circle gradient:

| Layer | Colors | Description |
| --- | --- | --- |
| Outer ring | `#FFE599` → `#F1C232` | Yellow semi-circles |
| W glyphs | `#FF9800` (×3) + connecting stroke | Wazoo Orange |

Note: the logo assets currently use `#FF9800` while the canonical primary in [DESIGN.md](https://github.com/wazootech/wazoo.dev/blob/main/DESIGN.md) is `#FF8C00`. Reconciling the two is a pending brand decision tracked in [wazoo.dev#32](https://github.com/wazootech/wazoo.dev/pull/32).

### Usage rules

-   Default dark background is `void` (`#040404`), not pure black.
-   Primary orange should appear on hover states and interactive elements.
-   Text should never be pure white on pure black — use `text` (`#B0B0B1`) for body.
-   `magenta` and `cyan` glitch tokens are reserved for decorative effects only.

## Typography

Official Wazoo typeface guidelines and type scale.

### Primary typefaces

| Role | Font | Weights | Source |
| --- | --- | --- | --- |
| Brand body | **IBM Plex Mono** | 400, 500 | Google Fonts |
| Brand headings | **Inter** | 400, 600 | System / Google Fonts |

### IBM Plex Mono

Used for all brand body copy, code snippets, and marketing text. The monospace aesthetic reinforces the technical, developer-focused identity.

```
font-family: "IBM Plex Mono", monospace;
font-weight: 400;
letter-spacing: -0.025em;
```

### Inter

Used for the wordmark logotype and UI labels where a clean, modern sans-serif is needed.

```
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
font-weight: 600;
letter-spacing: -0.02em;
```

### Type scale

| Element | Size | Weight | Color |
| --- | --- | --- | --- |
| H1 | 2.5rem | 600 | white |
| H2 | 1.5rem | 600 | white |
| Body | 1.0625rem | 400 | text |
| Caption | 0.875rem | 400 | text-muted |

### Usage rules

-   Body text should use `letter-spacing: -0.025em` for a tighter, modern feel.
-   Avoid more than 2 font weights in a single composition.
-   IBM Plex Mono is required for any code-adjacent content.
-   Inter is reserved for the wordmark and logo lockups only.

## Motion

Animation and motion principles for the Wazoo brand.

### Guiding principles

Wazoo's motion language has two modes:

1.  **Purposeful** — Motion that communicates meaning (state changes, transitions, feedback)
2.  **Quirky** — Decorative micro-animations that express personality and differentiate the brand

### Core animations

#### Fade in

Default entrance for all content on dark backgrounds.

```
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

#### Logo rotate

On hover, the W logo spins 360° with a cubic-bezier overshoot for a playful feel.

```
@keyframes rotate360 {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.logo-image:hover {
  animation: rotate360 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
```

### Quirky animations

| Class | Effect | Trigger |
| --- | --- | --- |
| `.quirk-highlight` | Orange highlight rotates + scales | hover |
| `.quirk-void` | Text expands letter-spacing and blurs | hover |
| `.quirk-breathe` | Subtle scale + opacity pulse | auto (4s loop) |
| `.quirk-glitch` | RGB split + clip distortion | hover |

### Reduced motion

Always respect `prefers-reduced-motion`. All animations collapse to instant transitions when enabled.

```
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Timing tokens

| Token | Value |
| --- | --- |
| Fast | `0.2s` |
| Normal | `0.3s` |
| Slow | `0.5s–0.6s` |
| Easing (standard) | `ease` |
| Easing (overshoot) | `cubic-bezier(0.68, -0.55, 0.27, 1.55)` |

## Assets

Downloadable Wazoo brand assets.

### Logo

The Wazoo logo lockup is available in light and dark variants. Always use the provided SVG files — never recreate or rasterize the logo.

### Light Mode

Darker variant for light backgrounds (#F7F2E8).

[Download wazoo.svg →](https://wazoo.dev/wazoo-light.svg)

### Dark Mode

Lighter variant for dark backgrounds (#040404).

[Download wazoo.svg →](https://wazoo.dev/wazoo.svg)

### Favicon

The favicon is the W Mark — [`favicon.svg`](https://wazoo.dev/favicon.svg).

### Wordmark

The wordmark is **"Wazoo"** in Inter 600 weight with the W glyph to its left in lockups. Always maintain clear space of at least the height of the W glyph on all sides.

### Usage rules

-   Do not stretch, rotate, recolor, or add effects to any logo asset.
-   Do not place logo assets on busy photographic backgrounds.
-   Use a solid `void` or `surface` background behind logos.

---
version: 1.0.0
name: Wazoo
colors:
  primary: "#FF8C00"
  primary-light: "#FFB74D"
  primary-dark: "#F57C00"
  highlight: "#FFAA00"
  selection: "#846CE4"
  void: "#040404"
  surface: "#0F0F0F"
  light-bg: "#F7F2E8"
  text: "#B0B0B1"
  text-muted: "#7C7C7C"
  white: "#FFFFFF"
  text-dark: "#1F1B14"
typography:
  fonts:
    body: "IBM Plex Mono, monospace"
    headings: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    wordmark: "Inter, sans-serif"
  scale:
    h1: "2.5rem"
    h2: "1.5rem"
    h3: "1.125rem"
    body: "1.0625rem"
    caption: "0.875rem"
motion:
  timing:
    fast: "0.2s"
    normal: "0.3s"
    slow: "0.6s"
  easing:
    standard: "ease"
    overshoot: "cubic-bezier(0.68, -0.55, 0.27, 1.55)"
shapes:
  border-radius: "8px"
---

# Wazoo Design System

A living reference and machine-readable specification for Wazoo's visual
identity.

## Overview

Wazoo builds persistent, neuro-symbolic memory infrastructure (world models as a
service) for AI agents. The design system reinforces a developer-first,
high-fidelity, and slightly quirky technical identity. It utilizes a
dark-mode-first, system-adaptive aesthetic with vibrant Sunset Orange accents
and monospaced typography.

## Colors

The color palette is strictly divided into functional semantic roles:

- **Primary Brand Accent:** Sunset Orange (`#FF8C00`) is used for primary
  actions, CTAs, links, and active states. It represents the energy of active
  reasoning and agent-driven commands.
- **System Adaptive Backgrounds:**
  - **Dark Mode (Default):** Void Black (`#040404`) is the standard background,
    preventing harsh contrast while maintaining deep black levels. Text uses
    `#B0B0B1` (gray) and headings use pure white (`#FFFFFF`).
  - **Light Mode (System-Adaptive):** Eggshell (`#F7F2E8`) background with Ink
    (`#1F1B14`) text, creating a warm, organic contrast instead of harsh cold
    whites.
- **Surface Elevation:** Elevated containers like cards, codeblocks, and menus
  use `#0F0F0F` in dark mode to stand out against the default background.

## Typography

Wazoo uses a dual-font system to balance readability with high-tech character:

- **IBM Plex Mono:** The main typeface for body copy, buttons, tooltips, and
  code. Using a clean monospace font emphasizes the codebase-adjacent nature of
  the product.
- **Inter:** Reserved for the logotype, main page headings, and certain UI badge
  labels where sans-serif readability is preferred.

## Motion

Animation at Wazoo is split into two modalities:

1. **Purposeful transitions:** Smooth utility animations (e.g. `fadeIn`,
   standard scale/transparency changes) that guide users through interface state
   changes.
2. **Quirky interactions:** Playful hover states that add personality.

### Timing Tokens

- **Fast (`0.2s`):** Immediate response, e.g. text selection, buttons.
- **Normal (`0.3s`):** Standard transitions, e.g. fade-ins.
- **Slow (`0.6s`):** Intentioned transitions, e.g. logo rotation.

### Interactive Animations

- **Logo Spin:** On hover, the logo SVG rotates 360 degrees using the
  `overshoot` easing: `cubic-bezier(0.68, -0.55, 0.27, 1.55)`
- **Highlight (Quirk):** Highlight elements (`.quirk-highlight`) are rotated -1
  degree by default. On hover, they scale up to `1.1` and rotate to `2` degrees.
- **Breathe (Quirk):** Element pulses in scale (up to `1.04`) and opacity
  (`0.85` to `1`) continuously on a `4s` ease-in-out loop. In light mode, it
  pulses between Umber (`#4B4332`) and Ink (`#1F1B14`).
- **Glitch (Quirk):** Glitch badges display an RGB split and clip path
  distortion on hover.

## Shapes

Wazoo uses a structured geometric language for user interface elements:

- **Border Radius:** All primary components (buttons, input fields, cards,
  system badges) use a standard **`8px`** corner radius. This gives a
  structured, modern layout while avoiding harsh point corners.
- **Elevation:** Surface borders use a subtle `1px` stroke instead of large
  gradients or heavy blur shadows to keep layouts feeling flat and mechanical.

## Do's and Don'ts

- **Do:** Use `letter-spacing: -0.025em` on monospaced text to keep it looking
  modern.
- **Do:** Respect prefers-reduced-motion media queries by overriding all
  transitions/animations to `0.01ms`.
- **Do:** Set `border-radius: 8px` on buttons, inputs, and cards.
- **Don't:** Use pure white text on a pure black background—always use `void`
  (`#040404`) and `text` (`#B0B0B1`).
- **Don't:** Stretch, rotate, or recolor the logo SVG assets directly.
- **Don't:** Use pill-shaped shapes or rounded corners greater than `12px` on
  standard components.

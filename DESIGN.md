---
version: 1.0.0
name: Wazoo
colors:
  primary: "#FF9800"
  primary-light: "#FFB74D"
  primary-dark: "#F57C00"
  highlight: "#FFAA00"
  selection: "#846CE4"
  void: "#040404"
  surface: "#0F0F0F"
  light-bg: "#FAFAF9"
  text: "#B0B0B1"
  text-muted: "#7C7C7C"
  white: "#FFFFFF"
  text-dark: "#18181B"
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
---

# Wazoo Design System

A living reference and machine-readable specification for Wazoo's visual identity.

## Overview

Wazoo builds persistent, neuro-symbolic memory infrastructure (world models as a service) for AI agents. The design system reinforces a developer-first, high-fidelity, and slightly quirky technical identity. It utilizes a dark-mode-first aesthetic with vibrant, energetic orange accents and monospaced typography.

## Colors

The color palette is strictly divided into functional semantic roles:

- **Primary Brand Accent:** Wazoo Orange (`#FF9800`) is used for primary actions, CTAs, links, and active states. It represents the energy of active reasoning and agent-driven commands.
- **Dark Void Background:** Wazoo uses `#040404` (not pure black) as the standard void background, which prevents harsh contrast while maintaining deep black levels.
- **Surface Elevation:** Elevated containers like cards, codeblocks, and menus use `#0F0F0F` to stand out against the default background.
- **Text Hierarchy:** High-contrast text uses pure white (`#FFFFFF`). Body copy uses `#B0B0B1` to reduce eye strain, and metadata or captions use `#7C7C7C`.

## Typography

Wazoo uses a dual-font system to balance readability with high-tech character:

- **IBM Plex Mono:** The main typeface for body copy, buttons, tooltips, and code. Using a clean monospace font emphasizes the codebase-adjacent nature of the product.
- **Inter:** Reserved for the logotype, main page headings, and certain UI badge labels where sans-serif readability is preferred.

## Motion

Animation at Wazoo is split into two modalities:

1. **Purposeful transitions:** Smooth utility animations (e.g. `fadeIn`, standard scale/transparency changes) that guide users through interface state changes.
2. **Quirky interactions:** Playful hover states that add personality.

### Timing Tokens

- **Fast (`0.2s`):** Immediate response, e.g. text selection, buttons.
- **Normal (`0.3s`):** Standard transitions, e.g. fade-ins.
- **Slow (`0.6s`):** Intentioned transitions, e.g. logo rotation.

### Interactive Animations

- **Logo Spin:** On hover, the logo SVG rotates 360 degrees using the `overshoot` easing:
  `cubic-bezier(0.68, -0.55, 0.27, 1.55)`
- **Highlight (Quirk):** Highlight elements (`.quirk-highlight`) are rotated -1 degree by default. On hover, they scale up to `1.1` and rotate to `2` degrees.
- **Breathe (Quirk):** Element pulses in scale (up to `1.04`) and opacity (`0.85` to `1`) continuously on a `4s` ease-in-out loop.
- **Glitch (Quirk):** Glitch badges display an RGB split and clip path distortion on hover.

## Do's and Don'ts

- **Do:** Use `letter-spacing: -0.025em` on monospaced text to keep it looking modern.
- **Do:** Respect prefers-reduced-motion media queries by overriding all transitions/animations to `0.01ms`.
- **Don't:** Use pure white text on a pure black background—always use `void` (`#040404`) and `text` (`#B0B0B1`).
- **Don't:** Stretch, rotate, or recolor the logo SVG assets directly.

# Wazoo Design System

The formal kit built on top of [DESIGN.md](../DESIGN.md). DESIGN.md stays the
canonical prose + machine-readable spec; this directory is the implementation
layer that code consumes.

## Files

| File | What it is |
|------|-----------|
| `tokens.css` | CSS custom properties, two layers: primitives (`--wz-orange-500`) and semantics (`--wz-primary`). Includes dark (default) + system-adaptive light themes, reduced-motion collapse, and shared selection styling. |
| `tokens.json` | Same values in machine-readable form for tooling (Tailwind theme generation, linting, future multi-platform output). |

## Token naming

```
--wz-<primitive-name>      raw values, never use directly in components
--wz-<semantic-role>       what a value means; use these in UI code
```

Primitives are numbered neutrals/scale steps so semantic roles can be
re-pointed later without renaming call sites.

## Consumption

Drop-in for any page or subproject:

```html
<link rel="stylesheet" href="/design-system/tokens.css" />
```

Then style against semantics only:

```css
.card {
  background: var(--wz-surface);
  border: var(--wz-border-width) solid var(--wz-border);
  border-radius: var(--wz-radius);
  color: var(--wz-text);
}
```

## Canonical value resolution (v1.1)

The archived `wazootech/brand` repo and DESIGN.md disagreed on two values.
Resolved in favor of DESIGN.md, which matches the live site:

- **Primary orange: `#FF8C00`** (not `#FF9800`)
- **Light background: eggshell `#F7F2E8`** (not `#FAFAF9`)

`tokens.json` records this decision so tooling never re-imports the stale
values.

## Rules carried over from DESIGN.md

- Never pure white body text on pure black; use `--wz-text` on `--wz-bg`.
- `8px` radius on all primary components; nothing above `12px`; no pills.
- Orange (`--wz-primary`) is for interactive states, CTAs, links, highlights —
  not decoration.
- Magenta/cyan are glitch-effect decorative tokens only.
- Max 2 font weights per composition; IBM Plex Mono required for anything
  code-adjacent.
- All motion collapses under `prefers-reduced-motion` (handled in tokens.css).

## Roadmap

1. **Done:** color, typography, spacing, shape, motion tokens (this directory).
2. **Next:** shared primitives — button, input, card, badge, codeblock — as a
   small CSS layer (`primitives.css`) matching the 8px/1px-stroke language.
3. **Then:** graph visualization tokens (node, edge, highlight states) as the
   signature element for world-model UIs.
4. **Then:** brand page at `/brand` re-rendered entirely from tokens.css so the
   guidelines and the site can't drift apart.

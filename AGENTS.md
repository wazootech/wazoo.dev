# Agent guidelines

## What this repo is

This repository contains the public Wazoo website.

## How to work here

- Keep company claims aligned with the site JSON-LD and current public
  positioning.
- Use `package.json` as the source of truth for local tasks.
- Run `bun run fmt` when editing source or content.
- After editing a page, run `bun run generate` and `bun run test`. Never
  edit the generated `llms*.txt`, `sitemap.xml`, or `index.md` files by hand.
- For visual changes, run the local dev task and inspect the rendered page
  before finishing when practical.

## Code health

Family-wide rules live in the
[wazootech workspace constitution](https://github.com/wazootech/workspace/blob/main/AGENTS.md#code-health-standards);
this repo's specifics:

- Before pushing, run `bun run ci` (CI runs the same).
- `.github/workflows/secret-scan.yml` runs gitleaks on every PR and push to
  `main`.
- Actions in `.github/workflows/` are pinned to commit SHAs and CI floats Bun
  on `1.x`; `renovate.json` keeps them current.
- `.github/CODEOWNERS` assigns `* @EthanThatOneKid`.
- There is no `code-health.yml`: the code is the shipped `snake.js` asset and
  the small generator in `scripts/`.

# Agent guidelines

## What this repo is

This repository contains the public Wazoo website.

## How to work here

- Keep company claims aligned with the site JSON-LD and current public
  positioning.
- Use `deno.json` as the source of truth for local tasks.
- Run `deno fmt` when editing source or content.
- For visual changes, run the local dev task and inspect the rendered page
  before finishing when practical.

## Code health

Family-wide rules live in the
[wazootech workspace constitution](https://github.com/wazootech/workspace/blob/main/AGENTS.md#code-health-standards);
this repo's specifics:

- Before pushing, run `deno fmt --check` (CI runs the same).
- `.github/workflows/secret-scan.yml` runs gitleaks on every PR and push to
  `main`.
- Actions in `.github/workflows/` are pinned to commit SHAs and CI uses Deno
  v2.9.8; `renovate.json` keeps them current.
- `.github/CODEOWNERS` assigns `* @EthanThatOneKid`.
- There is no `code-health.yml`: the only JavaScript is the shipped `snake.js`
  asset.

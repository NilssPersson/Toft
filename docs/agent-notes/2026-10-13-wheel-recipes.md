---
date: 2026-10-13
branch: claude/wheel-recipes
pr:
status: new
---

# Give every wheel spin a set recipe and redraw the wheel

## Got stuck on

- `npm run e2e` failed all 28 tests with `browserType.launch: Executable doesn't exist at .../chromium_headless_shell-1243/...` on a local Mac; fixed with `npx playwright install chromium`. `node_modules` was also missing (`npx tsc` could not find `astro/config`) until `npm ci`.

## Guessed

- Landing on an unfilled slot first kept the old "reset the level" rule; the user corrected it to a miss that keeps progress. `DESIGN.md` said "resets" for unfilled slots, so the old wording was followed.
- Recipes for levels past the written ones are generated from unlocked crops (`src/game/recipes.ts`), recorded as open question 4 in `DESIGN.md`.

## Repeated by hand

- Checking the wheel with slots filled needed a throwaway script: `npm run screenshot` and `e2e/layout.spec.ts` only shoot an empty wheel, so I built the test bundle, started `astro preview` myself and drove `window.__toft.loadState` from a scratch Playwright script.

## Rule friction

- CLAUDE.md says "never start a server yourself for e2e" and "use the tools, not a throwaway spec" for visual checks, but no tool can screenshot a given game state, so a manual preview server was the only way.

## Noticed, out of scope

- The update prompt's Restart button reused the wheel's `.spin-button` class (`src/ui/UpdatePrompt.tsx`); renamed to `.accent-button` here because the Spin button changed shape.

## Suggested change

- Let `npm run screenshot` take a state file or preset (e.g. `--state wheel-filled`) so HUD states can be reviewed without a scratch script.
- Add to CLAUDE.md "Testing": run `npm ci` and `npx playwright install chromium` first on a fresh local checkout (the cloud-only "never run `playwright install`" rule reads as global).

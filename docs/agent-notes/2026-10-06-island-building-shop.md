---
date: 2026-10-06
branch: claude/island-building-shop-6l506i
pr: 15
status: new
---

# Rework building: shop side panel, decorations and a ghost to confirm

## Got stuck on

- `e2e/player.spec.ts` "clicking a ready crop … harvests it" fails locally on both projects (5 s `toBeVisible` timeout on "Wheel (ready to spin)"). It fails on `main` too (3 of 4 runs with `--repeat-each 2`, local Chromium 1194). The failure screenshot shows the harvest did happen, just after the timeout. Not fixed here.
- An inline `python3` slice of `e2e/game.ts` cut out every helper between two markers; restored with `git checkout`. Edit tool would have been safer.
- `npm run build` (`astro check`) reported `findByRole(..., { disabled: false })` as TS2769; Vitest ran it without complaint, so it only showed up at build time.

- CI E2E failed on 4 tests (`Test timeout of 30000ms exceeded` at `page.screenshot` in `e2e/game.ts:106`). Screenshot tests already took 21–27 s on `main` in CI; my test took three screenshots and also slowed the island/layout screenshot tests in the other worker. Measured frame time with a scratch rAF spec: ~1.0–1.4 s per frame locally on both `main` and this branch, so no rendering regression. Fixed by one screenshot per test.
- `data-build-state` stayed `off` for over 5 s when `startBuild` ran right after `gotoGame`: it was only updated in `useFrame`, and the first frames compile shaders. It now also updates on store changes (`src/scene/BuildStateSignal.tsx`).

## Guessed

- "In front of the player" = the cell between the player and the camera, from the camera's offset rounded to a grid direction (`src/state/view.ts`). Arrow keys move relative to that view. Added as open question 12.
- The next cell after a confirm tries the item's facing direction first, then clockwise (`nextFreeCell` in `src/state/build.ts`).
- Unlock levels: stone wall and fence 1, flower bed 2, hedge 3, so the decorations tab has a locked item at level 1.
- Built decorations get uid `d<n>`, starting and migrated walls `w<n>`.
- ✓ validity runs `applyAction` and checks whether the state changed (`buildStatus`), so it can't disagree with the rules.

## Repeated by hand

- Reran single e2e specs on `main` with `git stash -u` to tell a pre-existing flake from a regression; each run rebuilds `dist-e2e/` (about 1 min).

## Rule friction

- `astro check` in `npm run build` also checks the built `dist-e2e/_astro/*.js` and prints pages of minified-code warnings (ts(80002)), which hide the real errors.
- `playwright/no-conditional-in-test` warned about `if (!cell) throw`; moved the throw into the `ghostCell` helper in `e2e/game.ts`.

## Noticed, out of scope

- Ghost drag (`src/scene/build/useGhostDrag.ts`) has no automated test because tests may not click canvas coordinates. Only keys, the hook and the HUD buttons are covered.
- `DecorationModel` ignores rotation except for fence rails. Fine while every decoration is a symmetric 1×1, but a non-square rotatable one would need a group rotation (`src/scene/models/DecorationModel.tsx`).
- ✓'s enabled state is computed at render. If the player walks off or onto the ghost's cell with no store change, the button lags until the next store update. `data-build-state` and the ghost tint are per frame / render as well (`src/ui/BuildControls.tsx`).

## Suggested change

- Document in `e2e/README.md` that a screenshot costs several seconds in CI (software WebGL, ~1 s frames), so a test should take at most one.

- Exclude `dist-e2e/` from `astro check` (tsconfig `exclude`) so build errors aren't buried.
- Find the root cause of the `player.spec.ts` harvest flake (the harvest waits on a render frame after `advanceTime`), or give `e2e/game.ts` a helper that waits for the pending crop to be tended.

---
date: 2026-10-06
branch: claude/bigger-island-cartoon-ocean
pr:
status: new
---

# Grow the island to 16×16 and give it a cartoon ocean

## Got stuck on

- None

## Guessed

- "Larger" read as 16×16 (from 12×12); spawn and starting wall moved to keep their place relative to the middle (`src/game/config.ts`).
- Old saves grow with the island and are recentred, rather than keeping a 12×12 island; logged as open question 10 in `DESIGN.md`.
- Ocean colours are not tone mapped (`toneMapped: false` in `src/scene/ocean/oceanMaterial.ts`): with ACES the white foam rendered grey.
- Under reduced motion the ocean is frozen at time 0, like the grass sway; no `data-state` added since nothing finishes.

## Repeated by hand

- Wide-view screenshots needed a throwaway spec (`e2e/zz-scratch.spec.ts`, deleted) that zooms out with `page.mouse.wheel`; `e2e/island.spec.ts` only captures the default zoom.

## Rule friction

- Unit tests hard-coded the 12-cell grid (`{ x: 11, z: 11 }`, `MIDDLE = { x: 6, z: 6 }` in `src/game/path.test.ts`, `src/game/rules.test.ts`, `e2e/player.spec.ts`); 3 failed on resize. Now derived from `ISLAND_SIZE` in the unit tests.

## Noticed, out of scope

- The default camera distance shows only part of a 16×16 island; `MAX_DISTANCE` raised to 22 but the start zoom is unchanged (`src/scene/FollowCamera.tsx`).

## Suggested change

- Give `saveScreenshot` (`e2e/game.ts`) an optional zoom-out step so review screenshots can show the whole island.

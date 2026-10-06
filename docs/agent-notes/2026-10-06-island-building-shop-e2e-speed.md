---
date: 2026-10-06
branch: claude/island-building-shop-6l506i
pr: 16
status: new
---

# Make the e2e suite cheaper: one worker, one screenshot per test

## Got stuck on

- No per-frame lever without changing the look: a rAF probe (scratch spec, deleted) measured desktop frames at ~626 ms; shadows off 390 ms, no grass tufts 527 ms, no ocean 513 ms, `dpr={1}` 560 ms. Shadows matter most but are part of what the screenshots review.

## Guessed

- This branch name was reused after PR #15 merged, so the note file name `2026-10-06-island-building-shop.md` was taken; added `-e2e-speed` to keep both notes.
- `workers: 1` everywhere, not only in CI: locally the suite is 2.6 min with 1 worker vs 2.2 min with 2 (most of it is the test build), and the crop-harvest test in `e2e/player.spec.ts` failed with 2 workers but passed with 1.
- `e2e/island.spec.ts` removed: its lawn screenshot matched `panel-closed` in `e2e/layout.spec.ts`, and its grid screenshot matched `build-ghost` in `e2e/build.spec.ts`.

## Repeated by hand

- Timing each step of a spec meant copying it into a scratch spec with `Date.now()` laps; the list reporter only gives totals per test.

## Rule friction

None

## Noticed, out of scope

- Every frame renders even when nothing moves (e.g. the HUD layout tests under reduced motion), which is where the CPU goes; `frameloop="demand"` would need the walk, growth and markers to invalidate.

## Suggested change

- Give `e2e/game.ts` a `timeSteps` helper (or enable a reporter with step timings) for finding slow waits.

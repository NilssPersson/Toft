---
date: 2026-10-06
branch: claude/agent-workflow-fixes
pr: 17
status: new
---

# Fix recurring friction from the agent notes: build noise, e2e flakes, screenshot and perf tools

## Got stuck on

- `npm ci` failed with `403` on every tarball from `registry.npmjs.org` (session egress policy), so `npm run lint`, `npm test`, `npm run typecheck`, `npm run build` and `npm run e2e` could not run in this session. Only Prettier ran (the global `/opt/node22/bin/prettier`, with a copy of `.prettierrc.json` minus `prettier-plugin-astro`). CI is the only check of this PR.

## Guessed

- `"exclude": ["dist", "dist-e2e"]` in `tsconfig.json` replaces Astro's base `exclude` (`["dist"]`), so `dist` is listed again; assumed `astro check` honours `exclude`, unverified locally.
- Harvest flake root cause read from PR #15's note and `src/scene/Player.tsx`: `tendPendingCrop` only runs in `useFrame`, so after `advanceTime` the harvest waited for a ~1 s software-WebGL frame. `advanceTime` in `src/testing/testHook.ts` now calls `tendPendingCrop` itself.
- `zoomOutFully` assumes OrbitControls zooms by a fixed factor per wheel event regardless of `deltaY`; 40 steps covers `MIN_DISTANCE` 7 to `MAX_DISTANCE` 22 with margin.

## Repeated by hand

- Ran Prettier with a hand-edited config copy because the repo's plugin isn't installed without `npm ci`.

## Rule friction

- `id-length` rejected `(a, b) => a - b` in a sort comparator in `e2e/tools/perf.tool.ts`; renamed to `first`, `second`.

## Noticed, out of scope

- A parallel PR on `main` (`docs/agent-notes/2026-10-06-island-building-shop-e2e-speed.md`) added the same one-screenshot-per-test rule to `CLAUDE.md` and `e2e/README.md`; after merging `main`, this PR's copies were removed.
- No `npm run note` script yet (suggested in PR #9's note); the note file name is still built by hand.

## Suggested change

- Add `scripts/newAgentNote.ts` behind `npm run note`, filling `date` and `branch` from `git`.

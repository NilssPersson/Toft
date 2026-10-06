---
date: 2026-10-06
branch: claude/island-grass-styling-iwowks
pr:
status: new
---

# Stylised grass, tufts and a turf edge for the island

## Got stuck on

- First grass build rendered ~75% slower per frame than `main` under SwiftShader (phone-landscape 195 ms vs 112 ms, measured with a throwaway rAF spec). Cause was overdraw: body top + turf lip top + lawn all covered the island. Fixed by drawing the body and lip as open four-sided tubes (`SidesGeometry` in `src/scene/Island.tsx`); now ~130 ms.
- `react-hooks/immutability` rejected `parts.uniforms.uTime.value = …` inside `useFrame` on a `useMemo` value; moved the write into `setSwayTime` in `src/scene/grass/swayMaterial.ts`.
- A 180-frame measurement timed out at 30 s: SwiftShader frames take 110–300 ms, so frame-time probes need few frames.

## Guessed

- Large-scale variation uses vertex colours on a subdivided ground plane instead of either option in the request (second texture or `onBeforeCompile`): no shader patching and no repeat at all.
- The old 0.3-cell sand border on top of the body became a grass verge (`GRASS.lip.verge`); clicks and placement hover on it are ignored in the scene.
- "Frame time stays smooth" checked by comparing to `main` under SwiftShader, not with an absolute threshold; no committed test asserts it.

## Repeated by hand

- Branch-vs-main frame time: stash the change, run a throwaway spec twice, restore. Each run rebuilds `dist-e2e/` (~30 s).
- Branch-vs-main bundle size: `git stash -u`, `astro build`, `ls -l dist/_astro/Game.*.js`.

## Rule friction

- `max-params` (3) pushed `tuftColor`/`writeInstances` to take a `Lawn` object; fine.
- `npm run build` output piped through `grep error` matches minified service-worker code and floods the terminal.

## Noticed, out of scope

- `saveScreenshot` lived in `e2e/layout.spec.ts`; moved to `e2e/game.ts` to reuse it.
- CI uploads the Playwright report only on failure (`CLAUDE.md` "Checks"), so screenshot attachments from passing review-only tests aren't kept as artifacts.

## Suggested change

- Add an `npm run e2e:perf` (or a helper in `e2e/game.ts`) that reports average and p95 frame time, so branch-vs-main comparisons don't need a throwaway spec.
- Upload the Playwright HTML report on every E2E run, so review screenshots (`e2e/layout.spec.ts`, `e2e/island.spec.ts`) are available as PR artifacts.

# E2E tests

Playwright tests for whole flows and layout, run on a desktop (1440×900) and a phone in landscape (iPhone 14).

```sh
npm run e2e      # builds the test build, serves it, runs every spec, shuts the server down
npm run e2e:ui   # the same, in Playwright's UI for debugging
npm run screenshot  # saves the default and zoomed-out view of /play to test-results/, for visual review
npm run e2e:perf    # prints average and p95 frame time; compare with main on the same machine
```

The two tools live in `tools/*.tool.ts` and use `playwright.tools.config.ts`; `npm run e2e` and CI don't run them. Use them instead of writing a throwaway spec.

Never start a server yourself. Rules and the reasons behind them are in "Testing" in `CLAUDE.md`.

## The pattern

Every test opens the game with `gotoGame`, which waits until the canvas has drawn a frame (`data-ready="true"`) and `window.__toft` is installed. Set up state through the hook, act through the HUD by role, and wait on `data-state` with web-first assertions.

```ts
import { expect, test } from '@playwright/test';
import { CROP_SLOTS } from '../src/game/index.ts';
import { gotoGame, loadState, rollFor, setNextRoll, sidePanel } from './game.ts';

test('a winning spin shows the result', async ({ page }) => {
  await gotoGame(page);
  await loadState(page, { wheel: { filled: Array.from({ length: CROP_SLOTS }, () => true) } });
  await setNextRoll(page, rollFor(0));

  await page.getByRole('button', { name: 'Wheel (ready to spin)' }).click();
  await sidePanel(page).getByRole('button', { name: /^Spin/ }).click();

  await expect(page.getByRole('img', { name: 'Wheel' })).toHaveAttribute('data-state', 'result');
  await expect(sidePanel(page).getByRole('status')).toHaveText('Win! −1 spin');
});
```

Speed: every page renders the 3D scene in software, so a frame takes about half a second locally and longer in CI, and anything that waits on a frame (`toBeInViewport`, a click's stability check, a screenshot) pays for it. Tests run one at a time (`workers: 1`) because two pages starve each other. Take at most one `saveScreenshot` per test, and don't take a screenshot another test already takes. To show the whole island in one, call `zoomOutFully(page)` first.

Time: `advanceTime(page, ms)` moves the game's clock forward, so crops grow instantly. Don't use `page.clock`: it also fakes `requestAnimationFrame` and freezes the 3D scene.

On failure, the trace and a screenshot are in `test-results/`; open the trace with `npx playwright show-trace <path>/trace.zip`.

## Time-driven state

`advanceTime` also does what the next frame would for state that only changes with time: the crop the player walked to is tended as soon as the clock says it has arrived. Tests don't have to wait for a slow frame after moving the clock.

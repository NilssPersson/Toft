# E2E tests

Playwright tests for whole flows and layout, run on a desktop (1440×900) and a phone in landscape (iPhone 14).

```sh
npm run e2e      # builds the test build, serves it, runs every spec, shuts the server down
npm run e2e:ui   # the same, in Playwright's UI for debugging
```

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

Time: `advanceTime(page, ms)` moves the game's clock forward, so crops grow instantly. Don't use `page.clock`: it also fakes `requestAnimationFrame` and freezes the 3D scene.

On failure, the trace and a screenshot are in `test-results/`; open the trace with `npx playwright show-trace <path>/trace.zip`.

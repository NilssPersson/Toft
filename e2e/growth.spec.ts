import { expect, test } from '@playwright/test';
import { getCrop } from '../src/game/index.ts';
import { advanceTime, dispatch, gameNow, gotoGame, isCropReady, loadState } from './game.ts';

test('a watered wheat is ready once its grow time has passed', async ({ page }) => {
  await gotoGame(page);
  const growMs = getCrop('wheat').growSeconds * 1000;
  const wheat = { uid: 'p1', cropId: 'wheat', x: 0, z: 0, status: 'growing' as const };
  // Harvesting needs the player next to the crop.
  const player = { x: 1, z: 0, path: [], walkStartedAt: 0 };
  await loadState(page, { crops: [{ ...wheat, growStartedAt: await gameNow(page) }], nextUid: 2, player });
  expect(await isCropReady(page, 'p1')).toBe(false);

  await advanceTime(page, growMs);
  expect(await isCropReady(page, 'p1')).toBe(true);

  // Harvesting fills a wheat slot of the first recipe, which the HUD shows on the ★.
  await expect(page.getByRole('button', { name: 'Wheel', exact: true })).toBeVisible();
  await dispatch(page, { type: 'harvest', uid: 'p1' });
  await expect(page.getByRole('button', { name: 'Wheel (ready to spin)' })).toBeVisible();
});

// `npm run screenshot`: saves pictures of /play to test-results/ for visual review, on desktop and phone-landscape.
// One screenshot per test: each costs several seconds under software WebGL.
import { expect, test } from '@playwright/test';
import { gotoGame, saveScreenshot, zoomOutFully } from '../game.ts';

test('the default view', async ({ page }, testInfo) => {
  await gotoGame(page);
  await expect(page.getByRole('status')).toBeHidden();
  await saveScreenshot(page, testInfo, 'play-default');
});

test('zoomed out to the whole island', async ({ page }, testInfo) => {
  await gotoGame(page);
  await expect(page.getByRole('status')).toBeHidden();
  await zoomOutFully(page);
  await saveScreenshot(page, testInfo, 'play-zoomed-out');
});

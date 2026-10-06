import { expect, test } from '@playwright/test';
import { gotoGame, saveScreenshot } from './game.ts';

test('the island lawn, without and with the placement grid', async ({ page }, testInfo) => {
  await gotoGame(page);
  await expect(page.getByRole('status')).toBeHidden();
  await saveScreenshot(page, testInfo, 'island-lawn');

  await page.getByRole('button', { name: 'Buy crops' }).click();
  await page.getByRole('menuitem', { name: /^Carrot/ }).click();
  // The placing hint and the grid both follow the selected crop.
  await expect(page.getByRole('status')).toBeVisible();
  await saveScreenshot(page, testInfo, 'island-placing');
});

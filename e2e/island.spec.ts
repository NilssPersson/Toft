import { expect, test } from '@playwright/test';
import { gotoGame, saveScreenshot } from './game.ts';

test('the island lawn, without and with the placement grid', async ({ page }, testInfo) => {
  await gotoGame(page);
  await expect(page.getByRole('status')).toBeHidden();
  await saveScreenshot(page, testInfo, 'island-lawn');

  await page.getByRole('button', { name: 'Shop' }).click();
  await page.getByRole('button', { name: /^Carrot/ }).click();
  // The build hint and the grid both follow build mode.
  await expect(page.getByTestId('game')).toHaveAttribute('data-build-state', 'valid');
  await expect(page.getByText('Drag to move · ✓ to build')).toBeVisible();
  await saveScreenshot(page, testInfo, 'island-placing');
});

import { expect, test } from '@playwright/test';
import { gotoGame, saveScreenshot, sidePanel } from './game.ts';

test('HUD layout with the side panel closed and open', async ({ page }, testInfo) => {
  await gotoGame(page);
  const star = page.getByRole('button', { name: /^Wheel/ });
  await expect(page.getByRole('button', { name: 'Level 1', exact: true })).toBeInViewport();
  await expect(star).toBeInViewport();
  await expect(sidePanel(page)).toHaveAttribute('data-state', 'closed');
  await saveScreenshot(page, testInfo, 'panel-closed');

  await star.click();
  await expect(sidePanel(page)).toHaveAttribute('data-state', 'open');
  await expect(sidePanel(page)).toBeInViewport();
  await expect(page.getByRole('img', { name: 'Wheel' })).toBeVisible();
  await saveScreenshot(page, testInfo, 'panel-open');
});

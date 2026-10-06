import { expect, test } from '@playwright/test';
import { gotoGame, saveScreenshot, sidePanel } from './game.ts';

// One screenshot per test: each one waits on a software-rendered frame, which is slow in CI.

test('HUD layout with the side panel closed, over the island lawn', async ({ page }, testInfo) => {
  await gotoGame(page);
  await expect(page.getByRole('button', { name: 'Level 1', exact: true })).toBeInViewport();
  await expect(page.getByRole('button', { name: /^Wheel/ })).toBeInViewport();
  await expect(sidePanel(page)).toHaveAttribute('data-state', 'closed');
  await saveScreenshot(page, testInfo, 'panel-closed');
});

test('HUD layout with the side panel open', async ({ page }, testInfo) => {
  await gotoGame(page);
  await page.getByRole('button', { name: /^Wheel/ }).click();
  await expect(sidePanel(page)).toHaveAttribute('data-state', 'open');
  await expect(sidePanel(page)).toBeInViewport();
  await expect(page.getByRole('img', { name: 'Wheel' })).toBeVisible();
  await saveScreenshot(page, testInfo, 'panel-open');
});

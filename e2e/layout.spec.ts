import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { gotoGame, sidePanel } from './game.ts';

/** Saves a full-page screenshot to test-results/ and the report. For review only: never compared pixel by pixel. */
async function saveScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

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

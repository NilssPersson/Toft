import { expect, test } from '@playwright/test';
import { gotoGame } from './game.ts';

test('/play loads with a ready canvas and the HUD', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await gotoGame(page);

  await expect(page.getByTestId('game').locator('canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Level 1', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

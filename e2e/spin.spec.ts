import { expect, test } from '@playwright/test';
import { CROP_SLOTS, spinsRequired } from '../src/game/index.ts';
import { getState, gotoGame, loadState, rollFor, setNextRoll, sidePanel } from './game.ts';

test('a winning spin shows the result and moves level progress on', async ({ page }) => {
  await gotoGame(page);
  await loadState(page, { wheel: { filled: Array.from({ length: CROP_SLOTS }, () => true) } });
  await setNextRoll(page, rollFor(0));

  await page.getByRole('button', { name: 'Wheel (ready to spin)' }).click();
  const panel = sidePanel(page);
  await expect(panel).toHaveAttribute('data-state', 'open');

  await panel.getByRole('button', { name: `Spin (${CROP_SLOTS}/${CROP_SLOTS} filled)` }).click();
  await expect(panel.getByRole('img', { name: 'Wheel' })).toHaveAttribute('data-state', 'result');
  await expect(panel.getByRole('status')).toHaveText('Win! −1 spin');
  await expect(panel.getByText(`1 / ${spinsRequired(1)} spins`)).toBeVisible();

  const { progression } = await getState(page);
  expect(progression).toEqual({ level: 1, spinsRemaining: spinsRequired(1) - 1 });
});

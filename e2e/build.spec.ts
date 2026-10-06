import { expect, test } from '@playwright/test';
import { PLAYER_SPAWN, cellKey } from '../src/game/index.ts';
import type { GridCell } from '../src/game/index.ts';
import {
  buildControls,
  dispatch,
  getState,
  ghostCell,
  gotoGame,
  loadState,
  moveGhost,
  saveScreenshot,
  shopPanel,
  sidePanel,
  startBuild,
} from './game.ts';

const STANDING_AT_SPAWN = { ...PLAYER_SPAWN, path: [], walkStartedAt: 0 };
const CARROT_CELL: GridCell = { x: 2, z: 2 };
const FREE_CELL: GridCell = { x: 3, z: 2 };

function stepsBetween(from: GridCell, to: GridCell): number {
  return Math.abs(to.x - from.x) + Math.abs(to.z - from.z);
}

test('a fence from the shop is moved with the keys, turned and built, and blocks the way', async ({ page }) => {
  await gotoGame(page);
  await loadState(page, { player: STANDING_AT_SPAWN });
  const game = page.getByTestId('game');

  await page.getByRole('button', { name: 'Shop' }).click();
  await shopPanel(page).getByRole('tab', { name: 'Decorations' }).click();
  await shopPanel(page)
    .getByRole('button', { name: /^Wooden fence/ })
    .click();
  await expect(shopPanel(page)).toHaveAttribute('data-state', 'closed');
  await expect(game).toHaveAttribute('data-build-state', 'valid');
  const start = await ghostCell(page);

  await page.keyboard.press('ArrowRight');
  await expect(game).not.toHaveAttribute('data-build-cell', cellKey(start));
  const fenceCell = await ghostCell(page);
  expect(stepsBetween(start, fenceCell)).toBe(1);
  await page.keyboard.press('r');
  await expect(game).toHaveAttribute('data-build-state', 'valid');
  await buildControls(page).getByRole('button', { name: 'Confirm' }).click();

  // Build mode carries on with the ghost on the next free cell.
  await expect(game).not.toHaveAttribute('data-build-cell', cellKey(fenceCell));
  await expect(game).not.toHaveAttribute('data-build-state', 'off');
  const { decorations, player } = await getState(page);
  expect(decorations.at(-1)).toMatchObject({ decorationId: 'wooden-fence', ...fenceCell, rotation: 90 });

  // Walking onto the fence does nothing; walking past it goes around it.
  await dispatch(page, { type: 'move', ...fenceCell });
  expect((await getState(page)).player).toEqual(player);
  const before = { x: fenceCell.x - 1, z: fenceCell.z };
  const after = { x: fenceCell.x + 1, z: fenceCell.z };
  await loadState(page, { decorations, player: { ...before, path: [], walkStartedAt: 0 } });
  await dispatch(page, { type: 'move', ...after });
  const { path } = (await getState(page)).player;
  expect(path.at(-1)).toEqual(after);
  expect(path.length).toBeGreaterThan(1);
});

test('a crop can only be planted on a free cell', async ({ page }) => {
  await gotoGame(page);
  const carrot = { uid: 'p1', cropId: 'carrot', ...CARROT_CELL, status: 'needsRequirement' as const };
  await loadState(page, { crops: [{ ...carrot, growStartedAt: null }], nextUid: 2, player: STANDING_AT_SPAWN });
  const game = page.getByTestId('game');

  await page.getByRole('button', { name: 'Shop' }).click();
  await shopPanel(page)
    .getByRole('button', { name: /^Carrot/ })
    .click();
  await moveGhost(page, CARROT_CELL);
  await expect(game).toHaveAttribute('data-build-state', 'invalid');
  await expect(game).toHaveAttribute('data-build-cell', cellKey(CARROT_CELL));
  await expect(buildControls(page).getByRole('button', { name: 'Confirm' })).toBeDisabled();

  await moveGhost(page, FREE_CELL);
  await expect(game).toHaveAttribute('data-build-state', 'valid');
  await buildControls(page).getByRole('button', { name: 'Confirm' }).click();
  await expect(game).not.toHaveAttribute('data-build-cell', cellKey(FREE_CELL));
  expect((await getState(page)).crops).toContainEqual(expect.objectContaining({ cropId: 'carrot', ...FREE_CELL }));

  await page.keyboard.press('Escape');
  await expect(game).toHaveAttribute('data-build-state', 'off');
});

// One screenshot per test: in CI a screenshot of the software-rendered canvas takes several seconds.
test('the shop panel, on its decorations tab', async ({ page }, testInfo) => {
  await gotoGame(page);
  await page.getByRole('button', { name: 'Shop' }).click();
  await shopPanel(page).getByRole('tab', { name: 'Decorations' }).click();
  await expect(shopPanel(page)).toHaveAttribute('data-state', 'open');
  await expect(shopPanel(page)).toBeInViewport();
  await expect(sidePanel(page)).toHaveAttribute('data-state', 'closed');
  await saveScreenshot(page, testInfo, 'shop-decorations');
});

test('a ghost with its buttons', async ({ page }, testInfo) => {
  await gotoGame(page);
  await loadState(page, { player: STANDING_AT_SPAWN });
  await startBuild(page, 'wooden-fence');
  await expect(page.getByTestId('game')).toHaveAttribute('data-build-state', 'valid');
  for (const name of ['Cancel', 'Rotate', 'Confirm']) {
    await expect(buildControls(page).getByRole('button', { name })).toBeInViewport({ ratio: 1 });
  }
  await saveScreenshot(page, testInfo, 'build-ghost');
});

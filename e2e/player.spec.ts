import { expect, test } from '@playwright/test';
import { PLAYER_SPAWN, WALK_CELLS_PER_SECOND, getCrop } from '../src/game/index.ts';
import type { GridCell } from '../src/game/index.ts';
import { advanceTime, clickCrop, dispatch, gameNow, getState, gotoGame, loadState, playerCell } from './game.ts';

const STEP_MS = 1000 / WALK_CELLS_PER_SECOND;
const STANDING_AT_SPAWN = { ...PLAYER_SPAWN, path: [], walkStartedAt: 0 };
/** The middle of the island, on the far side of the starting wall from the spawn cell. */
const MIDDLE: GridCell = { x: 6, z: 6 };
/** Around the wall to the middle one cell at a time; the real route is shorter. */
const CELL_BY_CELL_STEPS = 6;
/** The length of a 1.5 by 2 diagonal. */
const DIAGONAL_STEPS = 2.5;

test('the player walks around the wall to a clicked point, cutting the corners', async ({ page }) => {
  await gotoGame(page);
  await loadState(page, { player: STANDING_AT_SPAWN });

  await dispatch(page, { type: 'move', ...MIDDLE });
  const { path } = (await getState(page)).player;
  await advanceTime(page, CELL_BY_CELL_STEPS * STEP_MS);

  expect(await playerCell(page)).toEqual(MIDDLE);
  await expect(page.getByTestId('game')).toHaveAttribute('data-player-state', 'idle');
  // It has to turn to get around the wall, but goes straight between turns rather than cell by cell.
  expect(path.length).toBeGreaterThan(1);
  expect(path.length).toBeLessThan(CELL_BY_CELL_STEPS);
  expect(path.at(-1)).toEqual(MIDDLE);
});

test('the player walks straight across open ground, at any angle', async ({ page }) => {
  await gotoGame(page);
  await loadState(page, { player: STANDING_AT_SPAWN });
  const target = { x: PLAYER_SPAWN.x - 1.5, z: PLAYER_SPAWN.z - 2 };

  await dispatch(page, { type: 'move', ...target });

  expect((await getState(page)).player.path).toEqual([target]);
  await advanceTime(page, DIAGONAL_STEPS * STEP_MS);
  await expect(page.getByTestId('game')).toHaveAttribute('data-player-state', 'idle');
});

test('clicking a ready crop walks the player to it and harvests it', async ({ page }) => {
  await gotoGame(page);
  const growMs = getCrop('carrot').growSeconds * 1000;
  const carrot = { uid: 'p1', cropId: 'carrot', ...MIDDLE, status: 'growing' as const };
  await loadState(page, {
    crops: [{ ...carrot, growStartedAt: (await gameNow(page)) - growMs }],
    nextUid: 2,
    player: STANDING_AT_SPAWN,
  });
  await expect(page.getByRole('button', { name: 'Wheel', exact: true })).toBeVisible();

  await clickCrop(page, 'p1');
  const { path } = (await getState(page)).player;
  expect(path.length).toBeGreaterThan(0);
  await advanceTime(page, path.length * STEP_MS);

  await expect(page.getByRole('button', { name: 'Wheel (ready to spin)' })).toBeVisible();
  const { crops, wheel } = await getState(page);
  expect(crops[0]?.status).toBe('needsRequirement');
  expect(wheel.filled[0]).toBe(true);
});

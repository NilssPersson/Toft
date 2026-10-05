import { expect, test } from '@playwright/test';
import { PLAYER_SPAWN, STARTING_WALLS, WALK_CELLS_PER_SECOND, getCrop } from '../src/game/index.ts';
import type { GridCell } from '../src/game/index.ts';
import { advanceTime, clickCrop, dispatch, gameNow, getState, gotoGame, loadState, playerCell } from './game.ts';

const STEP_MS = 1000 / WALK_CELLS_PER_SECOND;
const STANDING_AT_SPAWN = { ...PLAYER_SPAWN, path: [], walkStartedAt: 0 };
/** The middle of the island, on the far side of the starting wall from the spawn cell. */
const MIDDLE: GridCell = { x: 6, z: 6 };

test('the player walks around the wall to a clicked cell', async ({ page }) => {
  await gotoGame(page);
  const [wall] = STARTING_WALLS;
  await loadState(page, { player: STANDING_AT_SPAWN });

  await dispatch(page, { type: 'move', ...MIDDLE });
  const { path } = (await getState(page)).player;
  await advanceTime(page, path.length * STEP_MS);

  expect(await playerCell(page)).toEqual(MIDDLE);
  await expect(page.getByTestId('game')).toHaveAttribute('data-player-state', 'idle');
  // Straight across is 4 steps; going around the wall takes 6, and never steps on it.
  expect(path).toHaveLength(6);
  expect(path).not.toContainEqual(wall);
  expect(path.at(-1)).toEqual(MIDDLE);
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

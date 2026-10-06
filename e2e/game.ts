// Helpers every e2e test uses: open the game, wait until it is ready, and drive window.__toft.
// Functions passed to page.evaluate run in the browser and can't share code with this file, so each is self-contained.
import { expect } from '@playwright/test';
import type { Locator, Page, TestInfo } from '@playwright/test';
import { WHEEL_SPOTS } from '../src/game/index.ts';
import type { Action, GameState, GridCell } from '../src/game/index.ts';
import type {} from '../src/testing/testHook.ts';

/** The welcome toast is UI state in localStorage; marking it seen keeps it out of every test. */
const WELCOME_SEEN_KEY = 'toft-welcome-seen';

/** Opens /play and waits until the canvas has drawn its first frame and the test hook is installed. */
export async function gotoGame(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    localStorage.setItem(key, '1');
  }, WELCOME_SEEN_KEY);
  await page.goto('/play');
  await expect(page.getByTestId('game')).toHaveAttribute('data-ready', 'true');
  await page.waitForFunction(() => window.__toft !== undefined);
}

/** A roll that lands in the middle of wheel spot i. */
export function rollFor(spotIndex: number): number {
  return (spotIndex + 0.5) / WHEEL_SPOTS;
}

/** The ★ panel with the wheel, found even while closed (it is hidden from the accessibility tree then). */
export function sidePanel(page: Page): Locator {
  return page.getByRole('complementary', { name: /^Level/, includeHidden: true });
}

/** The shop panel, found even while closed. */
export function shopPanel(page: Page): Locator {
  return page.getByRole('complementary', { name: 'Shop', includeHidden: true });
}

/** The ✕ / rotate / ✓ buttons over the ghost in build mode. */
export function buildControls(page: Page): Locator {
  return page.getByRole('group', { name: 'Build controls' });
}

export async function getState(page: Page): Promise<GameState> {
  const state = await page.evaluate(() => window.__toft?.getState());
  if (!state) throw new Error('window.__toft is missing: is this the test build?');
  return state;
}

export async function loadState(page: Page, partial: Partial<GameState>): Promise<void> {
  await page.evaluate((state) => window.__toft?.loadState(state), partial);
}

export async function advanceTime(page: Page, ms: number): Promise<void> {
  await page.evaluate((delta) => window.__toft?.advanceTime(delta), ms);
}

export async function setNextRoll(page: Page, roll: number): Promise<void> {
  await page.evaluate((value) => window.__toft?.setNextRoll(value), roll);
}

/** The game's clock (real time plus any advanceTime), for building plots that start growing "now". */
export async function gameNow(page: Page): Promise<number> {
  return page.evaluate(() => window.__toft?.now() ?? Number.NaN);
}

export async function isCropReady(page: Page, uid: string): Promise<boolean> {
  return page.evaluate((plotUid) => window.__toft?.isCropReady(plotUid) === true, uid);
}

/** Does what a click on the island would, without clicking canvas coordinates. */
export async function dispatch(page: Page, action: Action): Promise<void> {
  await page.evaluate((gameAction) => window.__toft?.dispatch(gameAction), action);
}

export async function playerCell(page: Page): Promise<GridCell | undefined> {
  return page.evaluate(() => window.__toft?.playerCell());
}

/** Does what a click on a crop would: the player walks next to it, then waters or harvests it. */
export async function clickCrop(page: Page, uid: string): Promise<void> {
  await page.evaluate((plotUid) => window.__toft?.clickCrop(plotUid), uid);
}

/** Starts build mode with a shop item, as picking it in the shop does. */
export async function startBuild(page: Page, itemId: string): Promise<void> {
  await page.evaluate((id) => window.__toft?.startBuild(id), itemId);
}

/** Does what dragging the ghost to a cell would, without touching the canvas. */
export async function moveGhost(page: Page, cell: GridCell): Promise<void> {
  await page.evaluate((target) => window.__toft?.moveGhost(target), cell);
}

/** The ghost's cell, from data-build-cell on the game root. Fails the test when not in build mode. */
export async function ghostCell(page: Page): Promise<GridCell> {
  const value = (await page.getByTestId('game').getAttribute('data-build-cell')) ?? '';
  const [x, z] = value.split(',').map(Number);
  if (x === undefined || z === undefined || Number.isNaN(x) || Number.isNaN(z)) {
    throw new Error(`Not in build mode (data-build-cell="${value}")`);
  }
  return { x, z };
}

/** Saves a full-page screenshot to test-results/ and the report. For review only: never compared pixel by pixel. */
export async function saveScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

/** Enough wheel steps to zoom from closest to farthest: each step zooms by a fixed factor, whatever its delta. */
const ZOOM_OUT_STEPS = 40;
const WHEEL_DELTA_Y = 100;

/** Zooms the camera out as far as it goes, so a screenshot shows the whole island. Scrolls, never clicks the canvas. */
export async function zoomOutFully(page: Page): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('The page has no viewport');
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  for (let i = 0; i < ZOOM_OUT_STEPS; i++) {
    await page.mouse.wheel(0, WHEEL_DELTA_Y);
  }
}

/** The time between `count` consecutive rendered frames, in ms, measured in the browser with requestAnimationFrame. */
export async function measureFrameTimes(page: Page, count: number): Promise<number[]> {
  return page.evaluate(
    (frameCount) =>
      new Promise<number[]>((resolve) => {
        const deltas: number[] = [];
        let previous: number | undefined;
        function onFrame(time: number): void {
          if (previous !== undefined) deltas.push(time - previous);
          previous = time;
          if (deltas.length < frameCount) requestAnimationFrame(onFrame);
          else resolve(deltas);
        }
        requestAnimationFrame(onFrame);
      }),
    count,
  );
}

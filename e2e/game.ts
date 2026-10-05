// Helpers every e2e test uses: open the game, wait until it is ready, and drive window.__toft.
// Functions passed to page.evaluate run in the browser and can't share code with this file, so each is self-contained.
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
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

/** The side panel, found even while closed (it is hidden from the accessibility tree then). */
export function sidePanel(page: Page): Locator {
  return page.getByRole('complementary', { includeHidden: true });
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

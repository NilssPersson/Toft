// window.__toft: lets e2e tests set up state and control time and randomness without playing through the canvas.
// Loaded only in test builds (PUBLIC_TEST_HOOKS=true, see App.tsx); `npm run build` fails if it reaches dist/.
import { initialState, isReady, playerCell } from '../game/index.ts';
import type { Action, GameState, GridCell } from '../game/index.ts';
import { setSources } from '../state/clock.ts';
import { moveGhost, startBuild } from '../state/build.ts';
import { tendPendingCrop, walkToCrop } from '../state/interaction.ts';
import { useStore } from '../state/store.ts';

export interface TestHook {
  getState: () => GameState;
  /** Replaces the game with a fresh state plus these fields. */
  loadState: (partial: Partial<GameState>) => void;
  /**
   * Moves the clock the store passes as `now` forward, so crops grow without waiting. Also tends the crop the player
   * walked to if it has now arrived, as the next frame would, so tests don't wait on slow software-WebGL frames.
   */
  advanceTime: (ms: number) => void;
  /** The next spin uses this roll instead of a random one. */
  setNextRoll: (value: number) => void;
  /** The clock the store passes as `now`, including any advanceTime. */
  now: () => number;
  /** Whether a crop is ready to harvest on that clock. */
  isCropReady: (uid: string) => boolean;
  /** Stands in for a click on the island, which tests never do by coordinates. */
  dispatch: (action: Action) => void;
  /** The cell the player stands on (or last reached, while walking) on that clock. */
  playerCell: () => GridCell;
  /** Stands in for a click on a crop: the player walks next to it, then waters or harvests it. */
  clickCrop: (uid: string) => void;
  /** Starts build mode with a shop item, as picking it in the shop does. A locked item does nothing. */
  startBuild: (itemId: string) => void;
  /** Stands in for dragging the ghost, or tapping a cell, in build mode. */
  moveGhost: (cell: GridCell) => void;
}

declare global {
  interface Window {
    __toft?: TestHook;
  }
}

let offsetMs = 0;
const nextRolls: number[] = [];

function testNow(): number {
  return Date.now() + offsetMs;
}

function testRoll(): number {
  return nextRolls.shift() ?? Math.random();
}

function isCropReady(uid: string): boolean {
  const plot = useStore.getState().game.crops.find((crop) => crop.uid === uid);
  return plot !== undefined && isReady(plot, testNow());
}

const TEST_HOOK: TestHook = {
  getState: () => useStore.getState().game,
  loadState: (partial) => {
    useStore.setState({ game: { ...initialState(), ...partial }, pendingCropUid: null, buildDraft: null });
  },
  advanceTime: (ms) => {
    offsetMs += ms;
    tendPendingCrop();
  },
  setNextRoll: (value) => {
    nextRolls.push(value);
  },
  now: testNow,
  isCropReady,
  dispatch: (action) => {
    useStore.getState().dispatch(action);
  },
  playerCell: () => playerCell(useStore.getState().game, testNow()),
  clickCrop: walkToCrop,
  startBuild,
  moveGhost,
};

export function installTestHook(): void {
  setSources({ now: testNow, roll: testRoll });
  window.__toft = TEST_HOOK;
}

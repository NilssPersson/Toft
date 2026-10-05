import { describe, expect, it } from 'vitest';
import { PLAYER_SPAWN, STARTING_WALLS, WALK_CELLS_PER_SECOND } from './config.ts';
import { findPath, isWalking, playerCell, playerPosition } from './path.ts';
import { canPlace } from './placement.ts';
import { applyAction, initialState } from './rules.ts';
import type { GameState, GridCell, PlacedCrop } from './types.ts';

const STEP_MS = 1000 / WALK_CELLS_PER_SECOND;
const MIDDLE: GridCell = { x: 6, z: 6 };
const ONE_BY_ONE = { w: 1, d: 1 };

function standAt(state: GameState, cell: GridCell): GameState {
  return { ...state, player: { ...cell, path: [], walkStartedAt: 0 } };
}

function carrotAt(cell: GridCell, overrides: Partial<PlacedCrop> = {}): PlacedCrop {
  return { uid: 'p1', cropId: 'carrot', ...cell, status: 'needsRequirement', growStartedAt: null, ...overrides };
}

function hasCell(path: GridCell[], cell: GridCell): boolean {
  return path.some((step) => step.x === cell.x && step.z === cell.z);
}

describe('findPath', () => {
  it('goes around the starting wall between the spawn cell and the middle of the island', () => {
    const wall = STARTING_WALLS[0];
    const path = findPath(initialState(), PLAYER_SPAWN, MIDDLE);
    expect(wall).toBeDefined();
    expect(path).toBeDefined();
    expect(path && wall && hasCell(path, wall)).toBe(false);
    // Straight across is 4 steps; the wall adds a step out and a step back.
    expect(path).toHaveLength(6);
    expect(path?.at(-1)).toEqual(MIDDLE);
  });

  it('only steps up, down, left or right, never between two blocked cells diagonally', () => {
    const state = { ...initialState(), walls: [{ x: 1, z: 0 }], crops: [carrotAt({ x: 0, z: 1 })] };
    expect(findPath(state, { x: 0, z: 0 }, { x: 1, z: 1 })).toBeUndefined();
    const path = findPath(initialState(), { x: 0, z: 0 }, { x: 3, z: 2 }) ?? [];
    let previous: GridCell = { x: 0, z: 0 };
    for (const step of path) {
      expect(Math.abs(step.x - previous.x) + Math.abs(step.z - previous.z)).toBe(1);
      previous = step;
    }
  });

  it('is deterministic: the same grid always gives the same path', () => {
    const first = findPath(initialState(), PLAYER_SPAWN, MIDDLE);
    expect(findPath(initialState(), PLAYER_SPAWN, MIDDLE)).toEqual(first);
    expect(first).toEqual([
      { x: 2, z: 5 },
      { x: 3, z: 5 },
      { x: 4, z: 5 },
      { x: 5, z: 5 },
      { x: 6, z: 5 },
      { x: 6, z: 6 },
    ]);
  });

  it('walks around crop footprints', () => {
    const state = { ...initialState(), walls: [], crops: [carrotAt({ x: 1, z: 0 })] };
    const path = findPath(state, { x: 0, z: 0 }, { x: 2, z: 0 }) ?? [];
    expect(hasCell(path, { x: 1, z: 0 })).toBe(false);
    expect(path).toHaveLength(4);
  });
});

describe('move', () => {
  it('walks the shortest path from where the player stands', () => {
    const state = applyAction(initialState(), { type: 'move', ...MIDDLE }, 1_000);
    expect(state.player).toEqual({
      ...PLAYER_SPAWN,
      path: findPath(initialState(), PLAYER_SPAWN, MIDDLE),
      walkStartedAt: 1_000,
    });
  });

  it('returns the same state for a wall, a crop, off the island, an unreachable cell or the cell the player is on', () => {
    const boxedIn = {
      ...initialState(),
      walls: [
        { x: 10, z: 11 },
        { x: 11, z: 10 },
      ],
    };
    const withCrop = { ...initialState(), crops: [carrotAt({ x: 0, z: 0 })] };
    const cases: [GameState, GridCell][] = [
      [initialState(), STARTING_WALLS[0] ?? MIDDLE],
      [withCrop, { x: 0, z: 0 }],
      [initialState(), { x: 12, z: 0 }],
      [boxedIn, { x: 11, z: 11 }],
      [initialState(), PLAYER_SPAWN],
    ];
    for (const [state, cell] of cases) expect(applyAction(state, { type: 'move', ...cell }, 0)).toBe(state);
  });

  it('a new move mid-walk starts from the current cell', () => {
    const walking = applyAction(standAt(initialState(), { x: 0, z: 0 }), { type: 'move', x: 5, z: 0 }, 0);
    const turned = applyAction(walking, { type: 'move', x: 0, z: 3 }, 2 * STEP_MS);
    expect(turned.player).toMatchObject({ x: 2, z: 0, walkStartedAt: 2 * STEP_MS });
    expect(turned.player.path.at(-1)).toEqual({ x: 0, z: 3 });
    expect(turned.player.path).toHaveLength(5);
  });

  it('mid-step, finishes the step it is taking before turning', () => {
    const walking = applyAction(standAt(initialState(), { x: 0, z: 0 }), { type: 'move', x: 5, z: 0 }, 0);
    const turned = applyAction(walking, { type: 'move', x: 0, z: 0 }, 1.5 * STEP_MS);
    expect(turned.player).toEqual({
      x: 1,
      z: 0,
      path: [
        { x: 2, z: 0 },
        { x: 1, z: 0 },
        { x: 0, z: 0 },
      ],
      walkStartedAt: STEP_MS,
    });
    expect(playerPosition(turned, 1.5 * STEP_MS)).toEqual(playerPosition(walking, 1.5 * STEP_MS));
  });

  it('a move to the cell the player is on stops the walk', () => {
    const walking = applyAction(standAt(initialState(), { x: 0, z: 0 }), { type: 'move', x: 5, z: 0 }, 0);
    const stopped = applyAction(walking, { type: 'move', x: 2, z: 0 }, 2 * STEP_MS);
    expect(stopped.player).toEqual({ x: 2, z: 0, path: [], walkStartedAt: 2 * STEP_MS });
    expect(isWalking(stopped, 2 * STEP_MS)).toBe(false);
  });
});

describe('playerCell and playerPosition', () => {
  const walking = applyAction(standAt(initialState(), { x: 0, z: 0 }), { type: 'move', x: 4, z: 0 }, 1_000);

  it('is at the start cell when the walk starts', () => {
    expect(playerCell(walking, 1_000)).toEqual({ x: 0, z: 0 });
    expect(playerPosition(walking, 1_000)).toEqual({ x: 0, z: 0 });
    expect(isWalking(walking, 1_000)).toBe(true);
  });

  it('is on the last cell reached in the middle of the walk, and between cells mid-step', () => {
    expect(playerCell(walking, 1_000 + 2 * STEP_MS)).toEqual({ x: 2, z: 0 });
    expect(playerCell(walking, 1_000 + 2.5 * STEP_MS)).toEqual({ x: 2, z: 0 });
    expect(playerPosition(walking, 1_000 + 2.5 * STEP_MS)).toEqual({ x: 2.5, z: 0 });
  });

  it('is at the target when the walk ends, and stays there', () => {
    expect(playerCell(walking, 1_000 + 4 * STEP_MS)).toEqual({ x: 4, z: 0 });
    expect(playerCell(walking, 1_000_000)).toEqual({ x: 4, z: 0 });
    expect(playerPosition(walking, 1_000_000)).toEqual({ x: 4, z: 0 });
    expect(isWalking(walking, 1_000 + 4 * STEP_MS)).toBe(false);
  });
});

describe('tending needs the player next to the crop', () => {
  const now = 50_000;
  const growing = carrotAt({ x: 5, z: 0 }, { status: 'growing', growStartedAt: 0 });

  it('fulfil is rejected from afar or diagonally, and accepted from next to the crop', () => {
    const base = { ...initialState(), crops: [carrotAt({ x: 5, z: 0 })] };
    for (const cell of [
      { x: 0, z: 0 },
      { x: 4, z: 1 },
    ]) {
      const state = standAt(base, cell);
      expect(applyAction(state, { type: 'fulfil', uid: 'p1' }, now)).toBe(state);
    }
    for (const cell of [
      { x: 4, z: 0 },
      { x: 6, z: 0 },
      { x: 5, z: 1 },
    ]) {
      const tended = applyAction(standAt(base, cell), { type: 'fulfil', uid: 'p1' }, now);
      expect(tended.crops[0]?.status).toBe('growing');
    }
  });

  it('harvest is rejected when not next to the crop, and accepted when next to it', () => {
    const far = standAt({ ...initialState(), crops: [growing] }, { x: 0, z: 0 });
    expect(applyAction(far, { type: 'harvest', uid: 'p1' }, now)).toBe(far);
    const near = standAt(far, { x: 5, z: 1 });
    expect(applyAction(near, { type: 'harvest', uid: 'p1' }, now).wheel.filled[0]).toBe(true);
  });

  it('counts the whole footprint of a larger crop', () => {
    const pumpkin: PlacedCrop = { ...carrotAt({ x: 5, z: 0 }), cropId: 'pumpkin' };
    const state = standAt({ ...initialState(), crops: [pumpkin] }, { x: 4, z: 1 });
    expect(applyAction(state, { type: 'fulfil', uid: 'p1' }, now).crops[0]?.status).toBe('growing');
  });

  it('only counts once the player has arrived', () => {
    const walking = applyAction(
      standAt({ ...initialState(), crops: [growing] }, { x: 0, z: 0 }),
      { type: 'move', x: 4, z: 0 },
      now,
    );
    expect(applyAction(walking, { type: 'harvest', uid: 'p1' }, now + 3.5 * STEP_MS)).toBe(walking);
    expect(applyAction(walking, { type: 'harvest', uid: 'p1' }, now + 4 * STEP_MS)).not.toBe(walking);
  });
});

describe('canPlace', () => {
  it('rejects wall cells and the cell the player is on', () => {
    const state = initialState();
    const wall = STARTING_WALLS[0] ?? MIDDLE;
    expect(canPlace(state, { ...wall, footprint: ONE_BY_ONE }, 0)).toBe(false);
    expect(canPlace(state, { ...PLAYER_SPAWN, footprint: ONE_BY_ONE }, 0)).toBe(false);
    expect(canPlace(state, { x: 0, z: 0, footprint: ONE_BY_ONE }, 0)).toBe(true);
    expect(applyAction(state, { type: 'place', cropId: 'carrot', ...PLAYER_SPAWN }, 0)).toBe(state);
  });

  it('follows the player as it walks', () => {
    const walking = applyAction(standAt(initialState(), { x: 0, z: 0 }), { type: 'move', x: 3, z: 0 }, 0);
    expect(canPlace(walking, { x: 0, z: 0, footprint: ONE_BY_ONE }, 0)).toBe(false);
    expect(canPlace(walking, { x: 0, z: 0, footprint: ONE_BY_ONE }, 3 * STEP_MS)).toBe(true);
    expect(canPlace(walking, { x: 3, z: 0, footprint: ONE_BY_ONE }, 3 * STEP_MS)).toBe(false);
  });
});

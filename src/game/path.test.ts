import { describe, expect, it } from 'vitest';
import { PLAYER_CLEARANCE, PLAYER_SPAWN, STARTING_WALLS, WALK_CELLS_PER_SECOND } from './config.ts';
import { cellOf, distanceBetween, findPath } from './path.ts';
import { canPlace } from './placement.ts';
import { applyAction, initialState } from './rules.ts';
import type { GameState, GridCell, IslandPoint, PlacedCrop } from './types.ts';
import { isWalking, playerCell, playerPosition } from './walk.ts';

const STEP_MS = 1000 / WALK_CELLS_PER_SECOND;
const MIDDLE: GridCell = { x: 6, z: 6 };
const ONE_BY_ONE = { w: 1, d: 1 };
const SAMPLE_STEP = 0.01;

function standAt(state: GameState, point: IslandPoint): GameState {
  return { ...state, player: { ...point, path: [], walkStartedAt: 0 } };
}

function carrotAt(cell: GridCell, overrides: Partial<PlacedCrop> = {}): PlacedCrop {
  return { uid: 'p1', cropId: 'carrot', ...cell, status: 'needsRequirement', growStartedAt: null, ...overrides };
}

/** Every point along the route, a hundredth of a cell apart. */
function pointsAlong(from: IslandPoint, path: IslandPoint[]): IslandPoint[] {
  const points: IslandPoint[] = [];
  let start = from;
  for (const end of path) {
    const samples = Math.ceil(distanceBetween(start, end) / SAMPLE_STEP);
    for (let i = 0; i <= samples; i++) {
      const along = samples === 0 ? 0 : i / samples;
      points.push({ x: start.x + (end.x - start.x) * along, z: start.z + (end.z - start.z) * along });
    }
    start = end;
  }
  return points;
}

/** The closest the route comes to a cell's square. */
function closestApproach(from: IslandPoint, path: IslandPoint[], cell: GridCell): number {
  const gap = (point: IslandPoint): number =>
    Math.hypot(Math.max(0, Math.abs(point.x - cell.x) - 0.5), Math.max(0, Math.abs(point.z - cell.z) - 0.5));
  return Math.min(...pointsAlong(from, path).map(gap));
}

function routeLength(from: IslandPoint, path: IslandPoint[]): number {
  return path.reduce((total, point, i) => total + distanceBetween(path[i - 1] ?? from, point), 0);
}

describe('findPath', () => {
  it('walks straight to a point in open ground, at any angle', () => {
    expect(findPath(initialState(), { x: 0, z: 0 }, { x: 3, z: 2 })).toEqual([{ x: 3, z: 2 }]);
    expect(findPath(initialState(), { x: 0.2, z: 0.1 }, { x: 2.7, z: 3.4 })).toEqual([{ x: 2.7, z: 3.4 }]);
  });

  it('goes around the starting wall, keeping its distance, by a shorter route than cell by cell', () => {
    const wall = STARTING_WALLS[0] ?? MIDDLE;
    const path = findPath(initialState(), PLAYER_SPAWN, MIDDLE) ?? [];
    expect(path.length).toBeGreaterThan(1);
    expect(path.at(-1)).toEqual(MIDDLE);
    expect(closestApproach(PLAYER_SPAWN, path, wall)).toBeGreaterThanOrEqual(PLAYER_CLEARANCE - SAMPLE_STEP);
    // Cell by cell, around the wall, is 6 steps; cutting the corners is shorter.
    expect(routeLength(PLAYER_SPAWN, path)).toBeLessThan(6);
  });

  it('walks around crop footprints', () => {
    const state = { ...initialState(), walls: [], crops: [carrotAt({ x: 1, z: 0 })] };
    const path = findPath(state, { x: 0, z: 0 }, { x: 2, z: 0 }) ?? [];
    expect(path.at(-1)).toEqual({ x: 2, z: 0 });
    expect(closestApproach({ x: 0, z: 0 }, path, { x: 1, z: 0 })).toBeGreaterThan(0);
  });

  it('never squeezes between two blocked cells that only touch at a corner', () => {
    const state = { ...initialState(), walls: [{ x: 1, z: 0 }], crops: [carrotAt({ x: 0, z: 1 })] };
    expect(findPath(state, { x: 0, z: 0 }, { x: 1, z: 1 })).toBeUndefined();
  });

  it('is empty when already there, and undefined for a blocked, off-island or unreachable point', () => {
    const boxedIn = {
      ...initialState(),
      walls: [
        { x: 10, z: 11 },
        { x: 11, z: 10 },
      ],
    };
    expect(findPath(initialState(), PLAYER_SPAWN, PLAYER_SPAWN)).toEqual([]);
    expect(findPath(initialState(), PLAYER_SPAWN, STARTING_WALLS[0] ?? MIDDLE)).toBeUndefined();
    expect(findPath(initialState(), PLAYER_SPAWN, { x: 11.6, z: 0 })).toBeUndefined();
    expect(findPath(boxedIn, PLAYER_SPAWN, { x: 11, z: 11 })).toBeUndefined();
    expect(findPath(initialState(), PLAYER_SPAWN, { x: Number.NaN, z: 0 })).toBeUndefined();
  });

  it('is deterministic: the same island always gives the same route', () => {
    expect(findPath(initialState(), PLAYER_SPAWN, MIDDLE)).toEqual(findPath(initialState(), PLAYER_SPAWN, MIDDLE));
  });
});

describe('move', () => {
  it('walks the route from where the player stands', () => {
    const state = applyAction(initialState(), { type: 'move', ...MIDDLE }, 1_000);
    expect(state.player).toEqual({
      ...PLAYER_SPAWN,
      path: findPath(initialState(), PLAYER_SPAWN, MIDDLE),
      walkStartedAt: 1_000,
    });
  });

  it('walks to the exact point, not the middle of its cell', () => {
    const state = applyAction(standAt(initialState(), { x: 0, z: 0 }), { type: 'move', x: 1.3, z: 0.6 }, 0);
    expect(playerPosition(state, 1_000_000)).toEqual({ x: 1.3, z: 0.6 });
  });

  it('returns the same state for a wall, a crop, off the island or the point the player is on', () => {
    const withCrop = { ...initialState(), crops: [carrotAt({ x: 0, z: 0 })] };
    const cases: [GameState, IslandPoint][] = [
      [initialState(), STARTING_WALLS[0] ?? MIDDLE],
      [withCrop, { x: 0.2, z: 0 }],
      [initialState(), { x: -0.6, z: 0 }],
      [initialState(), PLAYER_SPAWN],
    ];
    for (const [state, point] of cases) expect(applyAction(state, { type: 'move', ...point }, 0)).toBe(state);
  });

  it('a new move mid-walk starts from where the player is, even between cells', () => {
    const walking = applyAction(standAt(initialState(), { x: 0, z: 0 }), { type: 'move', x: 5, z: 0 }, 0);
    const turned = applyAction(walking, { type: 'move', x: 2.5, z: 3 }, 2.5 * STEP_MS);
    expect(turned.player).toEqual({ x: 2.5, z: 0, path: [{ x: 2.5, z: 3 }], walkStartedAt: 2.5 * STEP_MS });
  });

  it('a move to the point the player is on stops the walk', () => {
    const walking = applyAction(standAt(initialState(), { x: 0, z: 0 }), { type: 'move', x: 5, z: 0 }, 0);
    const stopped = applyAction(walking, { type: 'move', x: 2, z: 0 }, 2 * STEP_MS);
    expect(stopped.player).toEqual({ x: 2, z: 0, path: [], walkStartedAt: 2 * STEP_MS });
    expect(isWalking(stopped, 2 * STEP_MS)).toBe(false);
  });
});

describe('playerPosition and playerCell', () => {
  const walking = applyAction(standAt(initialState(), { x: 0, z: 0 }), { type: 'move', x: 3, z: 4 }, 1_000);

  it('is at the start when the walk starts', () => {
    expect(playerPosition(walking, 1_000)).toEqual({ x: 0, z: 0 });
    expect(isWalking(walking, 1_000)).toBe(true);
  });

  it('moves at the same speed in any direction, and is in the cell under it', () => {
    // 5 cells long diagonally, so halfway after 2.5 steps' time.
    expect(playerPosition(walking, 1_000 + 2.5 * STEP_MS)).toEqual({ x: 1.5, z: 2 });
    expect(playerCell(walking, 1_000 + 2.5 * STEP_MS)).toEqual({ x: 2, z: 2 });
  });

  it('is at the target when the walk ends, and stays there', () => {
    expect(playerPosition(walking, 1_000 + 5 * STEP_MS)).toEqual({ x: 3, z: 4 });
    expect(playerPosition(walking, 1_000_000)).toEqual({ x: 3, z: 4 });
    expect(isWalking(walking, 1_000 + 5 * STEP_MS)).toBe(false);
  });
});

describe('cellOf', () => {
  it('is the cell whose square the point is in', () => {
    expect(cellOf({ x: 2.49, z: 0.4 })).toEqual({ x: 2, z: 0 });
    expect(cellOf({ x: 2.5, z: 5.51 })).toEqual({ x: 3, z: 6 });
  });
});

describe('tending needs the player next to the crop', () => {
  const now = 50_000;
  const growing = carrotAt({ x: 5, z: 0 }, { status: 'growing', growStartedAt: 0 });

  it('fulfil is rejected from afar or diagonally, and accepted from next to the crop', () => {
    const base = { ...initialState(), crops: [carrotAt({ x: 5, z: 0 })] };
    for (const point of [
      { x: 0, z: 0 },
      { x: 4, z: 1 },
    ]) {
      const state = standAt(base, point);
      expect(applyAction(state, { type: 'fulfil', uid: 'p1' }, now)).toBe(state);
    }
    for (const point of [
      { x: 4, z: 0 },
      { x: 6.3, z: 0.2 },
      { x: 5, z: 1 },
    ]) {
      const tended = applyAction(standAt(base, point), { type: 'fulfil', uid: 'p1' }, now);
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

  it('counts once the player has walked into a cell next to it', () => {
    const walking = applyAction(
      standAt({ ...initialState(), crops: [growing] }, { x: 0, z: 0 }),
      { type: 'move', x: 4, z: 0 },
      now,
    );
    expect(applyAction(walking, { type: 'harvest', uid: 'p1' }, now + 3.4 * STEP_MS)).toBe(walking);
    expect(applyAction(walking, { type: 'harvest', uid: 'p1' }, now + 3.6 * STEP_MS)).not.toBe(walking);
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

import { describe, expect, it } from 'vitest';
import { ISLAND_SIZE, STARTING_WALLS, getDecoration } from './config.ts';
import { decorationCells, rotatedFootprint } from './grid.ts';
import { findPath } from './path.ts';
import { freeCellNear } from './placement.ts';
import { applyAction, initialState } from './rules.ts';
import type { Action, GameState, GridCell, Rotation } from './types.ts';

const FENCE = 'wooden-fence';
const FLOWER_BED = 'flower-bed';
const OPEN_CELL: GridCell = { x: 2, z: 2 };
const ONE_BY_ONE = { w: 1, d: 1 };

function build(decorationId: string, cell: GridCell, rotation: Rotation = 0): Action {
  return { type: 'build', decorationId, ...cell, rotation };
}

/** A fresh island with the player standing still in a corner, out of the way. */
function island(level = 1): GameState {
  const state = initialState();
  return {
    ...state,
    player: { x: 0, z: ISLAND_SIZE - 1, path: [], walkStartedAt: 0 },
    progression: { ...state.progression, level },
  };
}

describe('rotatedFootprint', () => {
  it('swaps width and depth on a quarter turn and keeps them on a half turn', () => {
    const footprint = { w: 2, d: 1 };
    expect(rotatedFootprint(footprint, 0)).toEqual({ w: 2, d: 1 });
    expect(rotatedFootprint(footprint, 90)).toEqual({ w: 1, d: 2 });
    expect(rotatedFootprint(footprint, 180)).toEqual({ w: 2, d: 1 });
    expect(rotatedFootprint(footprint, 270)).toEqual({ w: 1, d: 2 });
  });
});

describe('build', () => {
  it('builds an unlocked decoration on a free cell, with the next uid', () => {
    const state = applyAction(island(), build(FENCE, OPEN_CELL, 90), 0);
    expect(state.decorations.at(-1)).toEqual({
      uid: `d${initialState().nextUid}`,
      decorationId: FENCE,
      ...OPEN_CELL,
      rotation: 90,
    });
    expect(state.nextUid).toBe(initialState().nextUid + 1);
  });

  it('returns the same state off the island, on a crop, a decoration or the player', () => {
    const planted = applyAction(island(), { type: 'place', cropId: 'carrot', ...OPEN_CELL }, 0);
    const wall = STARTING_WALLS[0] ?? OPEN_CELL;
    const cells: GridCell[] = [
      { x: -1, z: 0 },
      { x: ISLAND_SIZE, z: 0 },
      OPEN_CELL,
      wall,
      { x: 0, z: ISLAND_SIZE - 1 },
    ];
    for (const cell of cells) expect(applyAction(planted, build(FENCE, cell), 0)).toBe(planted);
  });

  it('returns the same state for a locked or unknown decoration', () => {
    const state = island(1);
    expect(getDecoration(FLOWER_BED).unlockLevel).toBeGreaterThan(1);
    expect(applyAction(state, build(FLOWER_BED, OPEN_CELL), 0)).toBe(state);
    expect(applyAction(state, build('castle', OPEN_CELL), 0)).toBe(state);
    expect(applyAction(island(getDecoration(FLOWER_BED).unlockLevel), build(FLOWER_BED, OPEN_CELL), 0)).not.toBe(state);
  });

  it('only turns a decoration that can turn, and only by quarter turns', () => {
    const state = island();
    expect(applyAction(state, build('stone-wall', OPEN_CELL, 90), 0)).toBe(state);
    expect(applyAction(state, build(FENCE, OPEN_CELL, 45 as Rotation), 0)).toBe(state);
  });

  it('a fence blocks walking across its cell, and a flower bed does not', () => {
    const from = { x: OPEN_CELL.x - 1, z: OPEN_CELL.z };
    const fenced = applyAction(island(), build(FENCE, OPEN_CELL), 0);
    expect(findPath(fenced, from, OPEN_CELL)).toBeUndefined();
    expect(findPath(fenced, from, { x: OPEN_CELL.x + 1, z: OPEN_CELL.z })?.length).toBeGreaterThan(1);

    const bedded = applyAction(island(3), build(FLOWER_BED, OPEN_CELL), 0);
    expect(findPath(bedded, from, OPEN_CELL)).toEqual([OPEN_CELL]);
  });

  it('nothing can be built or planted on a walkable decoration', () => {
    const bedded = applyAction(island(3), build(FLOWER_BED, OPEN_CELL), 0);
    expect(applyAction(bedded, build(FENCE, OPEN_CELL), 0)).toBe(bedded);
    expect(applyAction(bedded, { type: 'place', cropId: 'carrot', ...OPEN_CELL }, 0)).toBe(bedded);
  });

  it('covers the rotated footprint', () => {
    const placed = { uid: 'd1', decorationId: FENCE, ...OPEN_CELL, rotation: 270 as const };
    expect(decorationCells(placed)).toEqual([OPEN_CELL]);
  });
});

describe('freeCellNear', () => {
  it('is the target when it is free, else the nearest free cell', () => {
    const state = island();
    expect(freeCellNear(state, { target: OPEN_CELL, footprint: ONE_BY_ONE }, 0)).toEqual(OPEN_CELL);
    const wall = STARTING_WALLS[0] ?? OPEN_CELL;
    const near = freeCellNear(state, { target: wall, footprint: ONE_BY_ONE }, 0);
    expect(near).toEqual({ x: wall.x, z: wall.z - 1 });
  });

  it('is undefined when nothing nearby is free', () => {
    const decorations = Array.from({ length: ISLAND_SIZE * ISLAND_SIZE }, (_, i) => ({
      uid: `d${i}`,
      decorationId: 'stone-wall',
      x: i % ISLAND_SIZE,
      z: Math.floor(i / ISLAND_SIZE),
      rotation: 0 as const,
    }));
    expect(freeCellNear({ ...island(), decorations }, { target: OPEN_CELL, footprint: ONE_BY_ONE }, 0)).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import { ISLAND_SIZE, PLAYER_SPAWN, STARTING_WALLS, STONE_WALL_ID } from './config.ts';
import { growIsland, growLayout, migrateFromV1, wallsToDecorations } from './migrate.ts';
import type { GameStateV1, GameStateV3 } from './migrate.ts';
import { initialState } from './rules.ts';
import type { GridCell, PlacedCrop } from './types.ts';

const WALL = STARTING_WALLS[0] ?? { x: 0, z: 0 };

function carrotAt(uid: string, cell: GridCell): PlacedCrop {
  return { uid, cropId: 'carrot', ...cell, status: 'growing', growStartedAt: 1_000 };
}

/** A save from before decorations, with walls on these cells. */
function v3Save(walls: GridCell[]): GameStateV3 {
  const { decorations: _decorations, ...rest } = initialState();
  return { ...rest, walls };
}

function v1Save(crops: PlacedCrop[]): GameStateV1 {
  const { player: _player, walls: _walls, ...rest } = v3Save([]);
  return {
    ...rest,
    crops,
    wheel: { filled: [true, false, true, false, false, false] },
    progression: { level: 3, spinsRemaining: 2 },
    nextUid: 7,
  };
}

describe('migrateFromV1', () => {
  it('keeps crops, wheel and progression, and adds the player at the spawn cell and the walls', () => {
    const save = v1Save([carrotAt('p1', { x: 0, z: 0 })]);
    const game = migrateFromV1(save);
    expect(game).toMatchObject({ crops: save.crops, wheel: save.wheel, progression: save.progression, nextUid: 7 });
    expect(game.player).toEqual({ ...PLAYER_SPAWN, path: [], walkStartedAt: 0 });
    expect(game.walls).toEqual(STARTING_WALLS);
  });

  it('keeps a crop on the wall cell and leaves that wall out', () => {
    const game = migrateFromV1(v1Save([carrotAt('p1', WALL)]));
    expect(game.crops).toHaveLength(1);
    expect(game.walls).toEqual([]);
  });

  it('keeps a crop on the spawn cell and puts the player on the nearest free cell', () => {
    const nextToSpawn = { x: PLAYER_SPAWN.x - 1, z: PLAYER_SPAWN.z };
    const game = migrateFromV1(v1Save([carrotAt('p1', PLAYER_SPAWN), carrotAt('p2', nextToSpawn)]));
    expect(game.crops).toHaveLength(2);
    expect(game.player).toMatchObject({ x: PLAYER_SPAWN.x, z: PLAYER_SPAWN.z - 1 });
  });
});

const OLD_ISLAND_SIZE = ISLAND_SIZE - 4;
const GROWTH_OFFSET = 2;

describe('growLayout', () => {
  it('grows a smaller island and moves its crops so they stay in the middle', () => {
    const game = growLayout({ ...v1Save([carrotAt('p1', { x: 0, z: 3 })]), islandSize: OLD_ISLAND_SIZE });
    expect(game.islandSize).toBe(ISLAND_SIZE);
    expect(game.crops[0]).toMatchObject({ x: GROWTH_OFFSET, z: 3 + GROWTH_OFFSET });
  });

  it('leaves an island that is already big enough alone', () => {
    const save = v1Save([carrotAt('p1', { x: 0, z: 0 })]);
    expect(growLayout(save)).toEqual(save);
  });
});

describe('growIsland', () => {
  it('moves the walls, the player and their walk along with the crops', () => {
    const player = { x: 1, z: 1, path: [{ x: 2.5, z: 1 }], walkStartedAt: 500 };
    const save = { ...v3Save([{ x: 4, z: 6 }]), islandSize: OLD_ISLAND_SIZE, player };
    const game = growIsland(save);
    expect(game.islandSize).toBe(ISLAND_SIZE);
    expect(game.walls).toEqual([{ x: 4 + GROWTH_OFFSET, z: 6 + GROWTH_OFFSET }]);
    expect(game.player).toEqual({ x: 3, z: 3, path: [{ x: 4.5, z: 3 }], walkStartedAt: 500 });
  });
});

describe('wallsToDecorations', () => {
  it('turns each wall into a stone wall on the same cell, keeping everything else', () => {
    const save = { ...v3Save([{ x: 4, z: 6 }, WALL]), crops: [carrotAt('p1', { x: 0, z: 0 })], nextUid: 9 };
    const game = wallsToDecorations(save);
    expect(game).not.toHaveProperty('walls');
    expect(game).toMatchObject({ crops: save.crops, player: save.player, nextUid: 9 });
    expect(game.decorations).toEqual([
      { uid: 'w1', decorationId: STONE_WALL_ID, x: 4, z: 6, rotation: 0 },
      { uid: 'w2', decorationId: STONE_WALL_ID, ...WALL, rotation: 0 },
    ]);
  });

  it('gives a save from before the player the same stone walls a new island starts with', () => {
    const game = wallsToDecorations(migrateFromV1(v1Save([])));
    expect(game.decorations).toEqual(initialState().decorations);
  });
});

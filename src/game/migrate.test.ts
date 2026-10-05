import { describe, expect, it } from 'vitest';
import { PLAYER_SPAWN, STARTING_WALLS } from './config.ts';
import { migrateFromV1 } from './migrate.ts';
import type { GameStateV1 } from './migrate.ts';
import { initialState } from './rules.ts';
import type { GridCell, PlacedCrop } from './types.ts';

const WALL = STARTING_WALLS[0] ?? { x: 0, z: 0 };

function carrotAt(uid: string, cell: GridCell): PlacedCrop {
  return { uid, cropId: 'carrot', ...cell, status: 'growing', growStartedAt: 1_000 };
}

function v1Save(crops: PlacedCrop[]): GameStateV1 {
  const { player: _player, walls: _walls, ...rest } = initialState();
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
    const game = migrateFromV1(v1Save([carrotAt('p1', PLAYER_SPAWN), carrotAt('p2', { x: 1, z: 6 })]));
    expect(game.crops).toHaveLength(2);
    expect(game.player).toMatchObject({ x: 2, z: 5 });
  });
});

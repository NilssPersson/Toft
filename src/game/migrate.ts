import { ISLAND_SIZE, PLAYER_SPAWN, STARTING_WALLS } from './config.ts';
import { cellKey, isOnIsland, occupiedCells } from './grid.ts';
import type { GameState, GridCell, IslandPoint, PlayerState } from './types.ts';

/** A save from before the player and walls existed (persist version 1). */
export type GameStateV1 = Omit<GameState, 'player' | 'walls'>;

/** Rings of cells around `center`, nearest first, in a fixed order. */
function cellsByDistance(center: GridCell, islandSize: number): GridCell[] {
  const cells: GridCell[] = [];
  for (let x = 0; x < islandSize; x++) {
    for (let z = 0; z < islandSize; z++) cells.push({ x, z });
  }
  const distance = (cell: GridCell): number => Math.abs(cell.x - center.x) + Math.abs(cell.z - center.z);
  return cells.sort((first, second) => distance(first) - distance(second));
}

/** The free cell nearest the spawn cell; the spawn cell itself if the island is full. */
function spawnCell(taken: Set<string>, islandSize: number): GridCell {
  const free = cellsByDistance(PLAYER_SPAWN, islandSize).find((cell) => !taken.has(cellKey(cell)));
  return free ?? PLAYER_SPAWN;
}

/**
 * Adds the player and the starting walls to a version 1 save, keeping its crops, wheel and progression.
 * A crop is never removed: a wall it covers is left out, and the player stands on the nearest free cell
 * to the spawn cell instead (see DESIGN.md "Open questions").
 */
export function migrateFromV1(game: GameStateV1): GameState {
  const crops = occupiedCells(game.crops);
  const walls = STARTING_WALLS.filter((wall) => !crops.has(cellKey(wall)) && isOnIsland(wall, game.islandSize));
  const taken = new Set([...crops, ...walls.map(cellKey)]);
  const player: PlayerState = { ...spawnCell(taken, game.islandSize), path: [], walkStartedAt: 0 };
  return { ...game, player, walls };
}

/** How far everything moves so a smaller island's layout sits in the middle of the current one. */
function growthOffset(islandSize: number): number {
  return Math.max(0, Math.floor((ISLAND_SIZE - islandSize) / 2));
}

function shift<T extends IslandPoint>(point: T, offset: number): T {
  return { ...point, x: point.x + offset, z: point.z + offset };
}

/** Grows a save's island to `ISLAND_SIZE`, moving its crops so they stay in the middle. Never shrinks one. */
export function growLayout<T extends GameStateV1>(game: T): T {
  const offset = growthOffset(game.islandSize);
  const crops = game.crops.map((plot) => shift(plot, offset));
  return { ...game, islandSize: Math.max(game.islandSize, ISLAND_SIZE), crops };
}

/** Grows a save's island like `growLayout`, moving the walls and the player (and any walk) along with the crops. */
export function growIsland(game: GameState): GameState {
  const offset = growthOffset(game.islandSize);
  const walls = game.walls.map((wall) => shift(wall, offset));
  const player = { ...shift(game.player, offset), path: game.player.path.map((point) => shift(point, offset)) };
  return { ...growLayout(game), walls, player };
}

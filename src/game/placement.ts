import { blockedCells, cellKey, cellsOf, isOnIsland, isSameCell } from './grid.ts';
import { playerCell } from './walk.ts';
import type { GameState, Placement } from './types.ts';

type Island = Pick<GameState, 'crops' | 'islandSize' | 'walls' | 'player'>;

/**
 * True if the placement fits on the island without covering a crop, a wall or the player's cell at `now`.
 * Cells further along a walk in progress are allowed (DESIGN.md "Open questions").
 */
export function canPlace(island: Island, placement: Placement, now: number): boolean {
  const blocked = blockedCells(island);
  const player = playerCell(island, now);
  return cellsOf(placement).every(
    (cell) => isOnIsland(cell, island.islandSize) && !blocked.has(cellKey(cell)) && !isSameCell(cell, player),
  );
}

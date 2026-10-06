import { cellKey, cellsOf, isOnIsland, isSameCell, takenCells } from './grid.ts';
import { playerCell } from './walk.ts';
import type { Footprint, GameState, GridCell, Placement } from './types.ts';

type Island = Pick<GameState, 'crops' | 'islandSize' | 'decorations' | 'player'>;

/** How far, in cells, `freeCellNear` looks around its target. */
const NEARBY_RADIUS = 3;

/**
 * True if the placement fits on the island without covering a crop, a decoration or the player's cell at `now`.
 * Cells further along a walk in progress are allowed (DESIGN.md "Open questions").
 */
export function canPlace(island: Island, placement: Placement, now: number): boolean {
  const taken = takenCells(island);
  const player = playerCell(island, now);
  return cellsOf(placement).every(
    (cell) => isOnIsland(cell, island.islandSize) && !taken.has(cellKey(cell)) && !isSameCell(cell, player),
  );
}

function stepsBetween(from: GridCell, to: GridCell): number {
  return Math.abs(to.x - from.x) + Math.abs(to.z - from.z);
}

/** Cells within `NEARBY_RADIUS` steps of `target`, nearest first; ties go to lowest z, then lowest x. */
function cellsAround(target: GridCell): GridCell[] {
  const cells: GridCell[] = [];
  for (let dz = -NEARBY_RADIUS; dz <= NEARBY_RADIUS; dz++) {
    for (let dx = -NEARBY_RADIUS; dx <= NEARBY_RADIUS; dx++) cells.push({ x: target.x + dx, z: target.z + dz });
  }
  return cells
    .filter((cell) => stepsBetween(cell, target) <= NEARBY_RADIUS)
    .sort((first, second) => stepsBetween(first, target) - stepsBetween(second, target));
}

export interface NearbySearch {
  target: GridCell;
  footprint: Footprint;
}

/** The cell nearest `target` where the footprint fits at `now`; undefined if nothing within a few cells is free. */
export function freeCellNear(island: Island, { target, footprint }: NearbySearch, now: number): GridCell | undefined {
  return cellsAround(target).find((cell) => canPlace(island, { ...cell, footprint }, now));
}

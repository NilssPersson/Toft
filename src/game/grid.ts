import { getCrop } from './config.ts';
import type { GameState, GridCell, PlacedCrop, Placement } from './types.ts';

export function cellsOf({ x, z, footprint }: Placement): GridCell[] {
  const cells: GridCell[] = [];
  for (let dx = 0; dx < footprint.w; dx++) {
    for (let dz = 0; dz < footprint.d; dz++) cells.push({ x: x + dx, z: z + dz });
  }
  return cells;
}

export function plotCells(plot: PlacedCrop): GridCell[] {
  return cellsOf({ x: plot.x, z: plot.z, footprint: getCrop(plot.cropId).footprint });
}

export function cellKey({ x, z }: GridCell): string {
  return `${x},${z}`;
}

export function isSameCell(first: GridCell, second: GridCell): boolean {
  return first.x === second.x && first.z === second.z;
}

export function occupiedCells(crops: PlacedCrop[]): Set<string> {
  return new Set(crops.flatMap(plotCells).map(cellKey));
}

/** Cells taken by a crop or a wall: nothing can be placed on them or walk through them. */
export function blockedCells(island: Pick<GameState, 'crops' | 'walls'>): Set<string> {
  const blocked = occupiedCells(island.crops);
  for (const wall of island.walls) blocked.add(cellKey(wall));
  return blocked;
}

export function isOnIsland({ x, z }: GridCell, islandSize: number): boolean {
  return x >= 0 && z >= 0 && x < islandSize && z < islandSize;
}

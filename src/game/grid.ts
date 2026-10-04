import { getCrop } from './config.ts';
import type { GameState, PlacedCrop, Placement } from './types.ts';

type Cell = [number, number];

export function cellsOf({ x, z, footprint }: Placement): Cell[] {
  const cells: Cell[] = [];
  for (let dx = 0; dx < footprint.w; dx++) {
    for (let dz = 0; dz < footprint.d; dz++) cells.push([x + dx, z + dz]);
  }
  return cells;
}

function cellKey([cellX, cellZ]: Cell): string {
  return `${cellX},${cellZ}`;
}

export function occupiedCells(crops: PlacedCrop[]): Set<string> {
  const taken = new Set<string>();
  for (const plot of crops) {
    const placement = { x: plot.x, z: plot.z, footprint: getCrop(plot.cropId).footprint };
    for (const cell of cellsOf(placement)) taken.add(cellKey(cell));
  }
  return taken;
}

function isOnIsland([cellX, cellZ]: Cell, islandSize: number): boolean {
  return cellX >= 0 && cellZ >= 0 && cellX < islandSize && cellZ < islandSize;
}

/** True if the placement fits on the island without overlapping another crop. */
export function canPlace(island: Pick<GameState, 'crops' | 'islandSize'>, placement: Placement): boolean {
  const taken = occupiedCells(island.crops);
  return cellsOf(placement).every((cell) => isOnIsland(cell, island.islandSize) && !taken.has(cellKey(cell)));
}

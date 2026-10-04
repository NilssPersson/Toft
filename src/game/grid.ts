import { getCrop } from './config.ts';
import type { Footprint, PlacedCrop } from './types.ts';

export function cellsOf(x: number, z: number, fp: Footprint): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let dx = 0; dx < fp.w; dx++) {
    for (let dz = 0; dz < fp.d; dz++) cells.push([x + dx, z + dz]);
  }
  return cells;
}

export function occupiedCells(crops: PlacedCrop[]): Set<string> {
  const set = new Set<string>();
  for (const c of crops) {
    for (const [cx, cz] of cellsOf(c.x, c.z, getCrop(c.cropId).footprint)) set.add(`${cx},${cz}`);
  }
  return set;
}

/** True if a footprint placed with its top-left at (x, z) fits on the island without overlapping. */
export function canPlace(crops: PlacedCrop[], islandSize: number, x: number, z: number, fp: Footprint): boolean {
  const taken = occupiedCells(crops);
  return cellsOf(x, z, fp).every(
    ([cx, cz]) => cx >= 0 && cz >= 0 && cx < islandSize && cz < islandSize && !taken.has(`${cx},${cz}`),
  );
}

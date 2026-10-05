import type { IslandPoint, Placement } from '../game/index.ts';

/** Converts between grid cells and world space. The island is centred on the origin, 1 unit per cell. */

export function footprintCenter({ x, z, footprint }: Placement, islandSize: number): [number, number, number] {
  const half = islandSize / 2;
  return [x - half + footprint.w / 2, 0, z - half + footprint.d / 2];
}

/** The centre of a cell, or any point on the island, in world space. */
export function cellCenter({ x, z }: IslandPoint, islandSize: number): [number, number, number] {
  return footprintCenter({ x, z, footprint: { w: 1, d: 1 } }, islandSize);
}

export function worldToCell(worldX: number, worldZ: number, islandSize: number): [number, number] {
  const half = islandSize / 2;
  return [Math.floor(worldX + half), Math.floor(worldZ + half)];
}

/** The island point (in cell units, cell centres at whole numbers) under a world position. */
export function worldToIsland(worldX: number, worldZ: number, islandSize: number): IslandPoint {
  const half = islandSize / 2;
  return { x: worldX + half - 0.5, z: worldZ + half - 0.5 };
}

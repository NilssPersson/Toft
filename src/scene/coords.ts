import type { Placement } from '../game/index.ts';

/** Converts between grid cells and world space. The island is centred on the origin, 1 unit per cell. */

export function footprintCenter({ x, z, footprint }: Placement, islandSize: number): [number, number, number] {
  const half = islandSize / 2;
  return [x - half + footprint.w / 2, 0, z - half + footprint.d / 2];
}

export function worldToCell(worldX: number, worldZ: number, islandSize: number): [number, number] {
  const half = islandSize / 2;
  return [Math.floor(worldX + half), Math.floor(worldZ + half)];
}

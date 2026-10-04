import type { Footprint } from '../game/index.ts';

/** Converts between grid cells and world space. The island is centred on the origin, 1 unit per cell. */

export function footprintCenter(x: number, z: number, fp: Footprint, islandSize: number): [number, number, number] {
  const half = islandSize / 2;
  return [x - half + fp.w / 2, 0, z - half + fp.d / 2];
}

export function worldToCell(wx: number, wz: number, islandSize: number): [number, number] {
  const half = islandSize / 2;
  return [Math.floor(wx + half), Math.floor(wz + half)];
}

import { getCrop, getDecoration } from './config.ts';
import type { Footprint, GameState, GridCell, PlacedCrop, PlacedDecoration, Placement, Rotation } from './types.ts';

export function cellsOf({ x, z, footprint }: Placement): GridCell[] {
  const cells: GridCell[] = [];
  for (let dx = 0; dx < footprint.w; dx++) {
    for (let dz = 0; dz < footprint.d; dz++) cells.push({ x: x + dx, z: z + dz });
  }
  return cells;
}

/** A quarter turn either way swaps width and depth; a half turn keeps them. */
export function rotatedFootprint(footprint: Footprint, rotation: Rotation): Footprint {
  const isQuarterTurn = rotation === 90 || rotation === 270;
  return isQuarterTurn ? { w: footprint.d, d: footprint.w } : footprint;
}

export function plotCells(plot: PlacedCrop): GridCell[] {
  return cellsOf({ x: plot.x, z: plot.z, footprint: getCrop(plot.cropId).footprint });
}

export function decorationCells(placed: PlacedDecoration): GridCell[] {
  const footprint = rotatedFootprint(getDecoration(placed.decorationId).footprint, placed.rotation);
  return cellsOf({ x: placed.x, z: placed.z, footprint });
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

type Layout = Pick<GameState, 'crops' | 'decorations'>;

function cellsCoveredBy(island: Layout, decorations: PlacedDecoration[]): Set<string> {
  const covered = occupiedCells(island.crops);
  for (const cell of decorations.flatMap(decorationCells)) covered.add(cellKey(cell));
  return covered;
}

/** Cells the player can't walk through: crops, and decorations that block walking. */
export function blockedCells(island: Layout): Set<string> {
  const blocking = island.decorations.filter((placed) => getDecoration(placed.decorationId).blocksWalking);
  return cellsCoveredBy(island, blocking);
}

/** Cells nothing can be built on: crops and every decoration, walkable or not. */
export function takenCells(island: Layout): Set<string> {
  return cellsCoveredBy(island, island.decorations);
}

export function isOnIsland({ x, z }: GridCell, islandSize: number): boolean {
  return x >= 0 && z >= 0 && x < islandSize && z < islandSize;
}

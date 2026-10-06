// Where the grass tufts go. Each cell has its own seed, so placing a crop only clears that crop's cells
// and every other tuft stays exactly where it was.
import { cellKey } from '../../game/index.ts';
import { GRASS } from './config.ts';
import { hashPoint, lerp, seededRandom } from './random.ts';

export interface Tuft {
  x: number;
  z: number;
  /** Turn around the vertical axis, in radians. */
  rotation: number;
  height: number;
  /** 0 to 1: which of the two tip colours the tuft leans toward. */
  tint: number;
}

export interface Lawn {
  islandSize: number;
  /** `cellKey`s of cells taken by crops and walls. */
  blocked: ReadonlySet<string>;
  perCell: number;
}

/** Keeps tufts off the cell borders, so they never poke into a neighbouring crop. */
const CELL_MARGIN = 0.12;
const UINT32 = 2 ** 32;

/** How many tufts each cell gets, so the island stays within `maxCount`. */
export function tuftsPerCell(islandSize: number, maxCount: number): number {
  return Math.min(GRASS.tufts.perCell, Math.floor(maxCount / (islandSize * islandSize)));
}

function tuftsInCell(cellX: number, cellZ: number, lawn: Lawn): Tuft[] {
  const random = seededRandom(hashPoint(cellX, cellZ, GRASS.seed) * UINT32);
  const [shortest, tallest] = GRASS.tufts.height;
  const half = lawn.islandSize / 2;
  return Array.from({ length: lawn.perCell }, () => ({
    x: cellX - half + lerp(CELL_MARGIN, 1 - CELL_MARGIN, random()),
    z: cellZ - half + lerp(CELL_MARGIN, 1 - CELL_MARGIN, random()),
    rotation: random() * Math.PI * 2,
    height: lerp(shortest, tallest, random()),
    tint: random(),
  }));
}

/** Every tuft on the lawn, in world space, skipping blocked cells. The same lawn always gives the same tufts. */
export function scatterTufts(lawn: Lawn): Tuft[] {
  const tufts: Tuft[] = [];
  for (let x = 0; x < lawn.islandSize; x++) {
    for (let z = 0; z < lawn.islandSize; z++) {
      if (!lawn.blocked.has(cellKey({ x, z }))) tufts.push(...tuftsInCell(x, z, lawn));
    }
  }
  return tufts;
}

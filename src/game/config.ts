import type { CropDef, GridCell } from './types.ts';

/** Tuning lives here so balancing never touches rule code. */

export const ISLAND_SIZE = 16;

/** Where a new player stands. */
export const PLAYER_SPAWN: GridCell = { x: 4, z: 8 };

export const WALK_CELLS_PER_SECOND = 4;

/** How far, in cells, the player keeps from walls, crops and the island's edge when cutting across. */
export const PLAYER_CLEARANCE = 0.3;

/** Between the spawn cell and the middle of the island, so the first walk there goes around it. */
export const STARTING_WALLS: GridCell[] = [{ x: 6, z: 8 }];

/** The wheel always has 6 crop slots, then a multiplier spot, then a reset spot. */
export const CROP_SLOTS = 6;
export const WHEEL_SPOTS = CROP_SLOTS + 2;
export const MULTIPLIER_SPOT = CROP_SLOTS;
export const RESET_SPOT = CROP_SLOTS + 1;

/** Wins needed to finish a level: 5 at level 1, then rising. */
export function spinsRequired(level: number): number {
  return 5 + (level - 1);
}

/** How many wins a multiplier hit is worth — always more than 1, scaling with level. */
export function multiplierBonus(level: number): number {
  return 2 + Math.floor(level / 5);
}

/** Placeholder crops; names, timings and unlock levels are all to be balanced. */
export const CROPS: CropDef[] = [
  {
    id: 'carrot',
    name: 'Carrot',
    footprint: { w: 1, d: 1 },
    growSeconds: 10,
    requirement: { kind: 'water' },
    unlockLevel: 1,
    color: '#e8893a',
  },
  {
    id: 'lettuce',
    name: 'Lettuce',
    footprint: { w: 1, d: 1 },
    growSeconds: 15,
    requirement: { kind: 'water' },
    unlockLevel: 1,
    color: '#7cc25a',
  },
  {
    id: 'pumpkin',
    name: 'Pumpkin',
    footprint: { w: 1, d: 2 },
    growSeconds: 30,
    requirement: { kind: 'water' },
    unlockLevel: 5,
    color: '#d9762b',
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    footprint: { w: 1, d: 1 },
    growSeconds: 20,
    requirement: { kind: 'water' },
    unlockLevel: 10,
    color: '#f2c84b',
  },
  {
    id: 'berry',
    name: 'Berry bush',
    footprint: { w: 2, d: 1 },
    growSeconds: 40,
    requirement: { kind: 'water' },
    unlockLevel: 15,
    color: '#9b3b6e',
  },
  {
    id: 'beanstalk',
    name: 'Beanstalk',
    footprint: { w: 1, d: 1 },
    growSeconds: 45,
    requirement: { kind: 'crop', cropId: 'sunflower' },
    unlockLevel: 20,
    color: '#3f8f4a',
  },
];

export const CROPS_BY_ID: Record<string, CropDef> = Object.fromEntries(CROPS.map((crop) => [crop.id, crop]));

export function getCrop(id: string): CropDef {
  const crop = CROPS_BY_ID[id];
  if (!crop) throw new Error(`Unknown crop: ${id}`);
  return crop;
}

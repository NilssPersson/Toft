import type { CropDef, CropId, DecorationDef, GridCell } from './types.ts';

/** Tuning lives here so balancing never touches rule code. */

export const ISLAND_SIZE = 16;

/** Where a new player stands. */
export const PLAYER_SPAWN: GridCell = { x: 4, z: 8 };

export const WALK_CELLS_PER_SECOND = 4;

/** How far, in cells, the player keeps from walls, fences, crops and the island's edge when cutting across. */
export const PLAYER_CLEARANCE = 0.3;

/** Stone walls between the spawn cell and the middle of the island, so the first walk there goes around one. */
export const STARTING_WALLS: GridCell[] = [{ x: 6, z: 8 }];

/** The decoration every starting wall, and every wall in a save from before decorations, becomes. */
export const STONE_WALL_ID = 'stone-wall';

/**
 * The wheel has 8 spots, clockwise from the top: the multiplier, three crop slots, an empty spot at the bottom,
 * then three more crop slots. `CROP_SPOTS[i]` is the spot that shows crop slot i.
 */
export const WHEEL_SPOTS = 8;
export const MULTIPLIER_SPOT = 0;
export const EMPTY_SPOT = 4;
export const CROP_SPOTS: readonly number[] = [1, 2, 3, 5, 6, 7];
export const CROP_SLOTS = CROP_SPOTS.length;

/** One spin's recipe: the crop each of the 6 slots needs, in slot order. */
export type Recipe = readonly CropId[];

/**
 * The recipes of each level, one per win: `LEVEL_RECIPES[level - 1][wins]`. The number of recipes is the number
 * of wins the level takes. Levels past the last one here get generated recipes (see recipes.ts).
 */
export const LEVEL_RECIPES: readonly (readonly Recipe[])[] = [
  [
    ['wheat', 'wheat', 'wheat', 'wheat', 'wheat', 'wheat'],
    ['wheat', 'wheat', 'carrot', 'wheat', 'wheat', 'carrot'],
    ['wheat', 'carrot', 'wheat', 'carrot', 'wheat', 'carrot'],
    ['wheat', 'carrot', 'lettuce', 'wheat', 'carrot', 'lettuce'],
    ['lettuce', 'wheat', 'lettuce', 'carrot', 'lettuce', 'wheat'],
  ],
  [
    ['carrot', 'carrot', 'carrot', 'carrot', 'carrot', 'carrot'],
    ['lettuce', 'lettuce', 'wheat', 'lettuce', 'lettuce', 'wheat'],
    ['wheat', 'carrot', 'carrot', 'wheat', 'lettuce', 'lettuce'],
    ['lettuce', 'lettuce', 'lettuce', 'lettuce', 'lettuce', 'lettuce'],
    ['carrot', 'wheat', 'lettuce', 'carrot', 'wheat', 'lettuce'],
    ['wheat', 'lettuce', 'carrot', 'carrot', 'lettuce', 'wheat'],
  ],
];

/** Wins needed to finish a level: its number of recipes, or 5 at level 1 rising by one a level past the written ones. */
export function spinsRequired(level: number): number {
  return LEVEL_RECIPES[level - 1]?.length ?? 5 + (level - 1);
}

/** How many wins a multiplier hit is worth — always more than 1, scaling with level. */
export function multiplierBonus(level: number): number {
  return 2 + Math.floor(level / 5);
}

/** Placeholder crops; names, timings and unlock levels are all to be balanced. */
export const CROPS: CropDef[] = [
  {
    id: 'wheat',
    name: 'Wheat',
    footprint: { w: 1, d: 1 },
    growSeconds: 8,
    requirement: { kind: 'water' },
    unlockLevel: 1,
    color: '#e3c15a',
  },
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

/** Placeholder decorations; names, colours and unlock levels are all to be balanced. Building is free for now. */
export const DECORATIONS: DecorationDef[] = [
  {
    id: STONE_WALL_ID,
    name: 'Stone wall',
    footprint: { w: 1, d: 1 },
    unlockLevel: 1,
    isRotatable: false,
    blocksWalking: true,
    color: '#9a958a',
  },
  {
    id: 'wooden-fence',
    name: 'Wooden fence',
    footprint: { w: 1, d: 1 },
    unlockLevel: 1,
    isRotatable: true,
    blocksWalking: true,
    color: '#a87445',
  },
  {
    id: 'flower-bed',
    name: 'Flower bed',
    footprint: { w: 1, d: 1 },
    unlockLevel: 2,
    isRotatable: false,
    blocksWalking: false,
    color: '#e27fa6',
  },
  {
    id: 'hedge',
    name: 'Hedge',
    footprint: { w: 1, d: 1 },
    unlockLevel: 3,
    isRotatable: false,
    blocksWalking: true,
    color: '#4c8a3c',
  },
];

export const DECORATIONS_BY_ID: Record<string, DecorationDef> = Object.fromEntries(
  DECORATIONS.map((decoration) => [decoration.id, decoration]),
);

export function getDecoration(id: string): DecorationDef {
  const decoration = DECORATIONS_BY_ID[id];
  if (!decoration) throw new Error(`Unknown decoration: ${id}`);
  return decoration;
}

export const CROPS_BY_ID: Record<string, CropDef> = Object.fromEntries(CROPS.map((crop) => [crop.id, crop]));

export function getCrop(id: string): CropDef {
  const crop = CROPS_BY_ID[id];
  if (!crop) throw new Error(`Unknown crop: ${id}`);
  return crop;
}

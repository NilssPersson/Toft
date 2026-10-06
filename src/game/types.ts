/**
 * Core game types. Everything in src/game is plain, serialisable data and
 * pure functions — no React, no Three.js, no Date.now(), no Math.random().
 * That keeps the rules testable and lets a server run them later for multiplayer.
 */

export type CropId = string;

/** Width (x) and depth (z) in grid cells. */
export interface Footprint {
  w: number;
  d: number;
}

/** One grid cell. */
export interface GridCell {
  x: number;
  z: number;
}

/**
 * A point anywhere on the island, in cell units: cell (x, z) has its centre at (x, z)
 * and reaches 0.5 to each side. The player stands and walks on points, not only on cell centres.
 */
export interface IslandPoint {
  x: number;
  z: number;
}

/** A footprint positioned on the grid, with its top-left cell at (x, z). */
export interface Placement {
  x: number;
  z: number;
  footprint: Footprint;
}

export type GrowthRequirement =
  | { kind: 'water' }
  /** Open design question: exactly how "needs another crop" is satisfied. */
  | { kind: 'crop'; cropId: CropId };

export interface CropDef {
  id: CropId;
  name: string;
  footprint: Footprint;
  growSeconds: number;
  requirement: GrowthRequirement;
  unlockLevel: number;
  /** Placeholder visual until real models exist. */
  color: string;
}

export type PlotStatus =
  /** Waiting for its requirement (e.g. water) before it starts growing. */
  | 'needsRequirement'
  /** Growing; becomes harvestable once growSeconds have passed since growStartedAt. */
  | 'growing';

export interface PlacedCrop {
  uid: string;
  cropId: CropId;
  /** Top-left cell of the footprint. */
  x: number;
  z: number;
  status: PlotStatus;
  /** Epoch ms when growth started; null while waiting for its requirement. */
  growStartedAt: number | null;
}

export interface WheelState {
  /** One entry per crop slot; true once a harvest of that slot's crop has filled it. */
  filled: boolean[];
}

export interface ProgressionState {
  level: number;
  /** Wins still needed to reach the next level. */
  spinsRemaining: number;
}

export type SpotKind = 'crop' | 'multiplier' | 'reset';

export interface SpinResult {
  spotIndex: number;
  spotKind: SpotKind;
  outcome: 'win' | 'multiplier' | 'reset';
  /** How much spinsRemaining dropped (0 on reset). */
  progress: number;
  leveledUp: boolean;
}

/**
 * The player walks in straight lines, at any angle, from point to point along `path`. Only the start of a walk
 * is stored; where the player is at any moment is derived from the path, the start time and the walking speed.
 */
export interface PlayerState {
  /** The point the current walk started from; where the player stands while `path` is empty. */
  x: number;
  z: number;
  /** The points still to walk to, in order, after (x, z). Empty when not walking. */
  path: IslandPoint[];
  /** Epoch ms when the player started walking `path`. */
  walkStartedAt: number;
}

export interface GameState {
  islandSize: number;
  crops: PlacedCrop[];
  player: PlayerState;
  /** 1×1 cells nothing can be placed on or walked through. */
  walls: GridCell[];
  wheel: WheelState;
  progression: ProgressionState;
  lastSpin: SpinResult | null;
  /** Monotonic counter used to mint unique plot ids deterministically. */
  nextUid: number;
}

/**
 * Every change to game state goes through an Action. Actions are plain data,
 * so later they can be sent over the network and replayed on a server.
 */
export type Action =
  | { type: 'place'; cropId: CropId; x: number; z: number }
  | { type: 'fulfil'; uid: string }
  | { type: 'harvest'; uid: string }
  /** Walk to a point on the island, around anything in the way. */
  | { type: 'move'; x: number; z: number }
  /** roll is a number in [0, 1) supplied by the caller (Math.random locally, a server later). */
  | { type: 'spin'; roll: number };

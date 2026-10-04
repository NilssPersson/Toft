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

export interface GameState {
  islandSize: number;
  crops: PlacedCrop[];
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
  /** roll is a number in [0, 1) supplied by the caller (Math.random locally, a server later). */
  | { type: 'spin'; roll: number };

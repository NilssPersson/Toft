import {
  CROPS,
  CROP_SLOTS,
  DECORATIONS_BY_ID,
  ISLAND_SIZE,
  PLAYER_SPAWN,
  STARTING_WALLS,
  getCrop,
  spinsRequired,
} from './config.ts';
import { stoneWallsAt } from './decorations.ts';
import { rotatedFootprint } from './grid.ts';
import { isNextToPlot } from './path.ts';
import { isWalking, playerCell, walkTo } from './walk.ts';
import { canPlace } from './placement.ts';
import { canSpin, emptyWheel, resolveSpin } from './wheel.ts';
import type { Action, CropDef, CropId, GameState, PlacedCrop, PlacedDecoration, Rotation } from './types.ts';

type ActionOf<T extends Action['type']> = Extract<Action, { type: T }>;
type ActionHandler<T extends Action['type']> = (state: GameState, action: ActionOf<T>, now: number) => GameState;

export function initialState(): GameState {
  return {
    islandSize: ISLAND_SIZE,
    crops: [],
    player: { ...PLAYER_SPAWN, path: [], walkStartedAt: 0 },
    decorations: stoneWallsAt(STARTING_WALLS),
    wheel: emptyWheel(),
    progression: { level: 1, spinsRemaining: spinsRequired(1) },
    lastSpin: null,
    nextUid: 1,
  };
}

export function unlockedCrops(level: number): CropDef[] {
  return CROPS.filter((crop) => crop.unlockLevel <= level).sort(
    (first, second) => first.unlockLevel - second.unlockLevel,
  );
}

/**
 * Which wheel slot a crop fills: slot i belongs to the i-th unlocked crop.
 * Returns -1 if the crop has no slot (locked, or beyond the 6 slots — an open design question).
 */
export function wheelSlotFor(cropId: CropId, level: number): number {
  const idx = unlockedCrops(level).findIndex((crop) => crop.id === cropId);
  return idx >= 0 && idx < CROP_SLOTS ? idx : -1;
}

/** 0..1 growth progress; 0 while waiting for its requirement. */
export function growthProgress(plot: PlacedCrop, now: number): number {
  if (plot.status !== 'growing' || plot.growStartedAt === null) return 0;
  const ms = getCrop(plot.cropId).growSeconds * 1000;
  return Math.min(1, Math.max(0, (now - plot.growStartedAt) / ms));
}

export function isReady(plot: PlacedCrop, now: number): boolean {
  return growthProgress(plot, now) >= 1;
}

function findPlot(state: GameState, uid: string): PlacedCrop | undefined {
  return state.crops.find((plot) => plot.uid === uid);
}

/** The plot, if the player is standing next to it at `now`. Watering and harvesting need this. */
function plotInReach(state: GameState, uid: string, now: number): PlacedCrop | undefined {
  const plot = findPlot(state, uid);
  return plot && isNextToPlot(playerCell(state, now), plot) ? plot : undefined;
}

function updatePlot(state: GameState, uid: string, patch: Partial<PlacedCrop>): GameState {
  return { ...state, crops: state.crops.map((plot) => (plot.uid === uid ? { ...plot, ...patch } : plot)) };
}

/** Marks the wheel slot that belongs to a crop as filled, if it has one. */
function fillWheelSlot(state: GameState, cropId: CropId): GameState {
  const slot = wheelSlotFor(cropId, state.progression.level);
  if (slot < 0) return state;
  const filled = state.wheel.filled.slice();
  filled[slot] = true;
  return { ...state, wheel: { filled } };
}

const applyPlace: ActionHandler<'place'> = (state, action, now) => {
  const crop = getCrop(action.cropId);
  if (crop.unlockLevel > state.progression.level) return state;
  if (!canPlace(state, { x: action.x, z: action.z, footprint: crop.footprint }, now)) return state;
  const plot: PlacedCrop = {
    uid: `p${state.nextUid}`,
    cropId: crop.id,
    x: action.x,
    z: action.z,
    status: 'needsRequirement',
    growStartedAt: null,
  };
  return { ...state, crops: [...state.crops, plot], nextUid: state.nextUid + 1 };
};

const ROTATIONS: readonly Rotation[] = [0, 90, 180, 270];

/** A decoration that can't turn only goes down at rotation 0; a value that isn't a quarter turn is refused. */
function isAllowedRotation(rotation: Rotation, isRotatable: boolean): boolean {
  return isRotatable ? ROTATIONS.includes(rotation) : rotation === 0;
}

/** Building is free for now (DESIGN.md "Open questions"). */
const applyBuild: ActionHandler<'build'> = (state, action, now) => {
  const decoration = DECORATIONS_BY_ID[action.decorationId];
  if (!decoration || decoration.unlockLevel > state.progression.level) return state;
  if (!isAllowedRotation(action.rotation, decoration.isRotatable)) return state;
  const footprint = rotatedFootprint(decoration.footprint, action.rotation);
  if (!canPlace(state, { x: action.x, z: action.z, footprint }, now)) return state;
  const placed: PlacedDecoration = {
    uid: `d${state.nextUid}`,
    decorationId: decoration.id,
    x: action.x,
    z: action.z,
    rotation: action.rotation,
  };
  return { ...state, decorations: [...state.decorations, placed], nextUid: state.nextUid + 1 };
};

const applyFulfil: ActionHandler<'fulfil'> = (state, action, now) => {
  // TODO: 'crop' requirements are fulfilled the same way as water for now,
  // until the design decides what "needs another crop" means in play.
  const plot = plotInReach(state, action.uid, now);
  if (plot?.status !== 'needsRequirement') return state;
  return updatePlot(state, plot.uid, { status: 'growing', growStartedAt: now });
};

const applyHarvest: ActionHandler<'harvest'> = (state, action, now) => {
  const plot = plotInReach(state, action.uid, now);
  if (!plot || !isReady(plot, now)) return state;
  // Harvesting keeps the crop; it just needs its requirement again to regrow.
  const harvested = updatePlot(state, plot.uid, { status: 'needsRequirement', growStartedAt: null });
  return fillWheelSlot(harvested, plot.cropId);
};

/** Walking to the point the player already stands on, while not walking, changes nothing. */
const applyMove: ActionHandler<'move'> = (state, action, now) => {
  const player = walkTo(state, { x: action.x, z: action.z }, now);
  if (!player) return state;
  if (player.path.length === 0 && !isWalking(state, now)) return state;
  return { ...state, player };
};

const applySpin: ActionHandler<'spin'> = (state, action) => {
  if (!canSpin(state.wheel)) return state;
  const { wheel, progression, result } = resolveSpin(state.wheel, state.progression, action.roll);
  return { ...state, wheel, progression, lastSpin: result };
};

/** One handler per action type; the mapped type makes a missing handler a type error. */
const HANDLERS: { [K in Action['type']]: ActionHandler<K> } = {
  place: applyPlace,
  build: applyBuild,
  fulfil: applyFulfil,
  harvest: applyHarvest,
  move: applyMove,
  spin: applySpin,
};

/**
 * The single entry point for changing game state. Invalid actions return the
 * state unchanged (same reference), so callers can cheaply detect a no-op.
 * `now` is passed in rather than read, keeping this function pure.
 */
export function applyAction(state: GameState, action: Action, now: number): GameState {
  // TypeScript can't correlate HANDLERS[action.type] with action, so widen the handler once here.
  const handler = HANDLERS[action.type] as (state: GameState, action: Action, now: number) => GameState;
  return handler(state, action, now);
}

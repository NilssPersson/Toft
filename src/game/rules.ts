import { CROPS, CROP_SLOTS, ISLAND_SIZE, getCrop, spinsRequired } from './config.ts';
import { canPlace } from './grid.ts';
import { canSpin, emptyWheel, resolveSpin } from './wheel.ts';
import type { Action, CropDef, CropId, GameState, PlacedCrop } from './types.ts';

export function initialState(): GameState {
  return {
    islandSize: ISLAND_SIZE,
    crops: [],
    wheel: emptyWheel(),
    progression: { level: 1, spinsRemaining: spinsRequired(1) },
    lastSpin: null,
    nextUid: 1,
  };
}

export function unlockedCrops(level: number): CropDef[] {
  return CROPS.filter((c) => c.unlockLevel <= level).sort((a, b) => a.unlockLevel - b.unlockLevel);
}

/**
 * Which wheel slot a crop fills: slot i belongs to the i-th unlocked crop.
 * Returns -1 if the crop has no slot (locked, or beyond the 6 slots — an open design question).
 */
export function wheelSlotFor(cropId: CropId, level: number): number {
  const idx = unlockedCrops(level).findIndex((c) => c.id === cropId);
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

/**
 * The single entry point for changing game state. Invalid actions return the
 * state unchanged (same reference), so callers can cheaply detect a no-op.
 * `now` is passed in rather than read, keeping this function pure.
 */
export function applyAction(state: GameState, action: Action, now: number): GameState {
  switch (action.type) {
    case 'place': {
      const crop = getCrop(action.cropId);
      if (crop.unlockLevel > state.progression.level) return state;
      if (!canPlace(state.crops, state.islandSize, action.x, action.z, crop.footprint)) return state;
      const plot: PlacedCrop = {
        uid: `p${state.nextUid}`,
        cropId: crop.id,
        x: action.x,
        z: action.z,
        status: 'needsRequirement',
        growStartedAt: null,
      };
      return { ...state, crops: [...state.crops, plot], nextUid: state.nextUid + 1 };
    }

    case 'fulfil': {
      // TODO: 'crop' requirements are fulfilled the same way as water for now,
      // until the design decides what "needs another crop" means in play.
      const plot = state.crops.find((c) => c.uid === action.uid);
      if (!plot || plot.status !== 'needsRequirement') return state;
      return updatePlot(state, plot.uid, { status: 'growing', growStartedAt: now });
    }

    case 'harvest': {
      const plot = state.crops.find((c) => c.uid === action.uid);
      if (!plot || !isReady(plot, now)) return state;
      // Harvesting keeps the crop; it just needs its requirement again to regrow.
      let next = updatePlot(state, plot.uid, { status: 'needsRequirement', growStartedAt: null });
      const slot = wheelSlotFor(plot.cropId, state.progression.level);
      if (slot >= 0) {
        const filled = next.wheel.filled.slice();
        filled[slot] = true;
        next = { ...next, wheel: { filled } };
      }
      return next;
    }

    case 'spin': {
      if (!canSpin(state.wheel)) return state;
      const { wheel, progression, result } = resolveSpin(state.wheel, state.progression, action.roll);
      return { ...state, wheel, progression, lastSpin: result };
    }
  }
}

function updatePlot(state: GameState, uid: string, patch: Partial<PlacedCrop>): GameState {
  return { ...state, crops: state.crops.map((c) => (c.uid === uid ? { ...c, ...patch } : c)) };
}

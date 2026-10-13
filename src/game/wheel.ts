import {
  CROP_SLOTS,
  CROP_SPOTS,
  EMPTY_SPOT,
  MULTIPLIER_SPOT,
  WHEEL_SPOTS,
  multiplierBonus,
  spinsRequired,
} from './config.ts';
import type { ProgressionState, SpinResult, SpotKind, WheelState } from './types.ts';

type SpinOutcome = Pick<SpinResult, 'outcome' | 'progress'>;

export function emptyWheel(): WheelState {
  return { filled: Array.from({ length: CROP_SLOTS }, () => false) };
}

export function spotKind(index: number): SpotKind {
  if (index === MULTIPLIER_SPOT) return 'multiplier';
  if (index === EMPTY_SPOT) return 'empty';
  return 'crop';
}

/** The crop slot a wheel spot shows, or -1 for the multiplier and the empty spot. */
export function slotForSpot(spotIndex: number): number {
  return CROP_SPOTS.indexOf(spotIndex);
}

export function filledCount(wheel: WheelState): number {
  return wheel.filled.filter(Boolean).length;
}

export function canSpin(wheel: WheelState): boolean {
  return filledCount(wheel) >= 1;
}

/** The multiplier spot only pays out once every crop slot is filled. */
export function multiplierActive(wheel: WheelState): boolean {
  return filledCount(wheel) === CROP_SLOTS;
}

/** Map a roll in [0, 1) to one of the 8 equally sized spots. */
export function spotForRoll(roll: number): number {
  return Math.min(WHEEL_SPOTS - 1, Math.max(0, Math.floor(roll * WHEEL_SPOTS)));
}

/**
 * What landing on a spot is worth. Anything but a filled slot or an active multiplier is a miss: the empty spot, an
 * unfilled slot, or the multiplier before all 6 slots are filled.
 */
function spinOutcome(wheel: WheelState, level: number, spotIndex: number): SpinOutcome {
  const kind = spotKind(spotIndex);
  if (kind === 'empty') return { outcome: 'miss', progress: 0 };
  if (kind === 'crop' && wheel.filled[slotForSpot(spotIndex)] === true) return { outcome: 'win', progress: 1 };
  if (kind === 'multiplier' && multiplierActive(wheel))
    return { outcome: 'multiplier', progress: multiplierBonus(level) };
  return { outcome: 'miss', progress: 0 };
}

/** Apply an outcome to progression: a miss changes nothing, a win may level up. Progress is never lost. */
function advanceProgression(
  { level, spinsRemaining }: ProgressionState,
  { outcome, progress }: SpinOutcome,
): { progression: ProgressionState; hasLeveledUp: boolean } {
  if (outcome === 'miss') return { progression: { level, spinsRemaining }, hasLeveledUp: false };
  const remaining = spinsRemaining - progress;
  if (remaining > 0) return { progression: { level, spinsRemaining: remaining }, hasLeveledUp: false };
  return { progression: { level: level + 1, spinsRemaining: spinsRequired(level + 1) }, hasLeveledUp: true };
}

/**
 * Resolve one spin. Pure: returns the new wheel and progression rather than mutating.
 *
 * Assumptions to confirm (see DESIGN.md "Open questions"):
 *  - a spin consumes all filled slots (otherwise there is no reason to wait and fill more)
 *  - landing on the multiplier before all 6 slots are filled counts as a miss
 */
export function resolveSpin(
  wheel: WheelState,
  prog: ProgressionState,
  roll: number,
): { wheel: WheelState; progression: ProgressionState; result: SpinResult } {
  const spotIndex = spotForRoll(roll);
  const outcome = spinOutcome(wheel, prog.level, spotIndex);
  const { progression, hasLeveledUp } = advanceProgression(prog, outcome);
  return {
    wheel: emptyWheel(),
    progression,
    result: { spotIndex, spotKind: spotKind(spotIndex), ...outcome, leveledUp: hasLeveledUp },
  };
}

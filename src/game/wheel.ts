import { CROP_SLOTS, MULTIPLIER_SPOT, RESET_SPOT, WHEEL_SPOTS, multiplierBonus, spinsRequired } from './config.ts';
import type { ProgressionState, SpinResult, SpotKind, WheelState } from './types.ts';

type SpinOutcome = Pick<SpinResult, 'outcome' | 'progress'>;

export function emptyWheel(): WheelState {
  return { filled: Array.from({ length: CROP_SLOTS }, () => false) };
}

export function spotKind(index: number): SpotKind {
  if (index === MULTIPLIER_SPOT) return 'multiplier';
  if (index === RESET_SPOT) return 'reset';
  return 'crop';
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

/** What landing on a spot is worth. Landing on the multiplier before all 6 slots are filled counts as a reset. */
function spinOutcome(wheel: WheelState, level: number, spotIndex: number): SpinOutcome {
  const kind = spotKind(spotIndex);
  if (kind === 'crop' && wheel.filled[spotIndex] === true) return { outcome: 'win', progress: 1 };
  if (kind === 'multiplier' && multiplierActive(wheel))
    return { outcome: 'multiplier', progress: multiplierBonus(level) };
  return { outcome: 'reset', progress: 0 };
}

/** Apply an outcome to progression: a reset loses the level's progress, a win may level up. */
function advanceProgression(
  { level, spinsRemaining }: ProgressionState,
  { outcome, progress }: SpinOutcome,
): { progression: ProgressionState; hasLeveledUp: boolean } {
  if (outcome === 'reset') {
    return { progression: { level, spinsRemaining: spinsRequired(level) }, hasLeveledUp: false };
  }
  const remaining = spinsRemaining - progress;
  if (remaining > 0) return { progression: { level, spinsRemaining: remaining }, hasLeveledUp: false };
  return { progression: { level: level + 1, spinsRemaining: spinsRequired(level + 1) }, hasLeveledUp: true };
}

/**
 * Resolve one spin. Pure: returns the new wheel and progression rather than mutating.
 *
 * Assumptions to confirm (see DESIGN.md "Open questions"):
 *  - a spin consumes all filled slots (otherwise there is no reason to wait and fill more)
 *  - landing on the multiplier before all 6 slots are filled counts as a reset
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

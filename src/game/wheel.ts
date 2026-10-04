import { CROP_SLOTS, MULTIPLIER_SPOT, RESET_SPOT, WHEEL_SPOTS, multiplierBonus, spinsRequired } from './config.ts';
import type { ProgressionState, SpinResult, SpotKind, WheelState } from './types.ts';

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
  const kind = spotKind(spotIndex);

  let outcome: SpinResult['outcome'];
  let progress = 0;
  if (kind === 'crop' && wheel.filled[spotIndex]) {
    outcome = 'win';
    progress = 1;
  } else if (kind === 'multiplier' && multiplierActive(wheel)) {
    outcome = 'multiplier';
    progress = multiplierBonus(prog.level);
  } else {
    outcome = 'reset';
  }

  let { level, spinsRemaining } = prog;
  let leveledUp = false;
  if (outcome === 'reset') {
    spinsRemaining = spinsRequired(level);
  } else {
    spinsRemaining -= progress;
    if (spinsRemaining <= 0) {
      level += 1;
      spinsRemaining = spinsRequired(level);
      leveledUp = true;
    }
  }

  return {
    wheel: emptyWheel(),
    progression: { level, spinsRemaining },
    result: { spotIndex, spotKind: kind, outcome, progress, leveledUp },
  };
}

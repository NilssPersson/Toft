import { describe, expect, it } from 'vitest';
import { applyAction, initialState, isReady } from './rules.ts';
import { CROP_SLOTS, MULTIPLIER_SPOT, RESET_SPOT, WHEEL_SPOTS, multiplierBonus, spinsRequired } from './config.ts';
import { canPlace } from './grid.ts';
import type { GameState, PlacedCrop } from './types.ts';

/** A roll that lands exactly in the middle of spot i. */
const rollFor = (i: number): number => (i + 0.5) / WHEEL_SPOTS;

function cropAt(state: GameState, index: number): PlacedCrop {
  const plot = state.crops.at(index);
  if (!plot) throw new Error(`No crop at index ${index}`);
  return plot;
}

function growAndHarvestCarrot(state: GameState, x: number, t0: number): GameState {
  const planted = applyAction(state, { type: 'place', cropId: 'carrot', x, z: 0 }, t0);
  const uid = cropAt(planted, -1).uid;
  const growing = applyAction(planted, { type: 'fulfil', uid }, t0);
  return applyAction(growing, { type: 'harvest', uid }, t0 + 10_000);
}

describe('grid', () => {
  it('rejects out-of-bounds and overlapping placements', () => {
    const state = applyAction(initialState(), { type: 'place', cropId: 'carrot', x: 0, z: 0 }, 0);
    expect(canPlace(state, { x: 0, z: 0, footprint: { w: 1, d: 1 } })).toBe(false);
    expect(canPlace(state, { x: 11, z: 11, footprint: { w: 1, d: 2 } })).toBe(false);
    expect(canPlace(state, { x: 1, z: 0, footprint: { w: 1, d: 1 } })).toBe(true);
  });

  it('does not place crops that are still locked', () => {
    const s0 = initialState();
    expect(applyAction(s0, { type: 'place', cropId: 'pumpkin', x: 0, z: 0 }, 0)).toBe(s0);
  });
});

describe('crop growth', () => {
  it('waits for its requirement, grows, and is not removed on harvest', () => {
    let state = applyAction(initialState(), { type: 'place', cropId: 'carrot', x: 0, z: 0 }, 0);
    const uid = cropAt(state, 0).uid;
    expect(applyAction(state, { type: 'harvest', uid }, 999_999)).toBe(state);

    state = applyAction(state, { type: 'fulfil', uid }, 1_000);
    expect(isReady(cropAt(state, 0), 10_999)).toBe(false);
    expect(isReady(cropAt(state, 0), 11_000)).toBe(true);

    state = applyAction(state, { type: 'harvest', uid }, 11_000);
    expect(state.crops).toHaveLength(1);
    expect(cropAt(state, 0).status).toBe('needsRequirement');
    expect(state.wheel.filled[0]).toBe(true);
  });
});

describe('wheel', () => {
  it('cannot spin with no filled slots', () => {
    const s0 = initialState();
    expect(applyAction(s0, { type: 'spin', roll: 0 }, 0)).toBe(s0);
  });

  it('a filled crop slot is a win and consumes the filled slots', () => {
    let state = growAndHarvestCarrot(initialState(), 0, 0);
    state = applyAction(state, { type: 'spin', roll: rollFor(0) }, 0);
    expect(state.lastSpin?.outcome).toBe('win');
    expect(state.progression.spinsRemaining).toBe(spinsRequired(1) - 1);
    expect(state.wheel.filled.every((isFilled) => !isFilled)).toBe(true);
  });

  it('an unfilled slot or the reset spot resets progress', () => {
    let state = growAndHarvestCarrot(initialState(), 0, 0);
    state = applyAction(state, { type: 'spin', roll: rollFor(0) }, 0);
    state = growAndHarvestCarrot(state, 1, 0);
    const afterMiss = applyAction(state, { type: 'spin', roll: rollFor(3) }, 0);
    expect(afterMiss.lastSpin?.outcome).toBe('reset');
    expect(afterMiss.progression.spinsRemaining).toBe(spinsRequired(1));
    const afterReset = applyAction(state, { type: 'spin', roll: rollFor(RESET_SPOT) }, 0);
    expect(afterReset.lastSpin?.outcome).toBe('reset');
  });

  it('the multiplier only pays out once all slots are filled', () => {
    let state = growAndHarvestCarrot(initialState(), 0, 0);
    expect(applyAction(state, { type: 'spin', roll: rollFor(MULTIPLIER_SPOT) }, 0).lastSpin?.outcome).toBe('reset');

    state = {
      ...state,
      progression: { level: 1, spinsRemaining: 10 },
      wheel: { filled: Array.from({ length: CROP_SLOTS }, () => true) },
    };
    state = applyAction(state, { type: 'spin', roll: rollFor(MULTIPLIER_SPOT) }, 0);
    expect(state.lastSpin?.outcome).toBe('multiplier');
    expect(state.progression.spinsRemaining).toBe(10 - multiplierBonus(1));
  });

  it('levels up when the required wins are reached', () => {
    let state = initialState();
    for (let i = 0; i < spinsRequired(1); i++) {
      state = growAndHarvestCarrot(state, i, i * 100_000);
      state = applyAction(state, { type: 'spin', roll: rollFor(0) }, 0);
    }
    expect(state.progression.level).toBe(2);
    expect(state.progression.spinsRemaining).toBe(spinsRequired(2));
    expect(state.lastSpin?.leveledUp).toBe(true);
  });
});

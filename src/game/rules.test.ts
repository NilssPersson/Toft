import { describe, expect, it } from 'vitest';
import { applyAction, initialState, isReady } from './rules.ts';
import { CROP_SLOTS, MULTIPLIER_SPOT, RESET_SPOT, WHEEL_SPOTS, multiplierBonus, spinsRequired } from './config.ts';
import { canPlace } from './grid.ts';
import type { GameState } from './types.ts';

/** A roll that lands exactly in the middle of spot i. */
const rollFor = (i: number) => (i + 0.5) / WHEEL_SPOTS;

function growAndHarvestCarrot(state: GameState, x: number, t0: number): GameState {
  let s = applyAction(state, { type: 'place', cropId: 'carrot', x, z: 0 }, t0);
  const uid = s.crops.at(-1)!.uid;
  s = applyAction(s, { type: 'fulfil', uid }, t0);
  return applyAction(s, { type: 'harvest', uid }, t0 + 10_000);
}

describe('grid', () => {
  it('rejects out-of-bounds and overlapping placements', () => {
    const s = applyAction(initialState(), { type: 'place', cropId: 'carrot', x: 0, z: 0 }, 0);
    expect(canPlace(s.crops, s.islandSize, 0, 0, { w: 1, d: 1 })).toBe(false);
    expect(canPlace(s.crops, s.islandSize, 11, 11, { w: 1, d: 2 })).toBe(false);
    expect(canPlace(s.crops, s.islandSize, 1, 0, { w: 1, d: 1 })).toBe(true);
  });

  it('does not place crops that are still locked', () => {
    const s0 = initialState();
    expect(applyAction(s0, { type: 'place', cropId: 'pumpkin', x: 0, z: 0 }, 0)).toBe(s0);
  });
});

describe('crop growth', () => {
  it('waits for its requirement, grows, and is not removed on harvest', () => {
    let s = applyAction(initialState(), { type: 'place', cropId: 'carrot', x: 0, z: 0 }, 0);
    const uid = s.crops[0]!.uid;
    expect(applyAction(s, { type: 'harvest', uid }, 999_999)).toBe(s);

    s = applyAction(s, { type: 'fulfil', uid }, 1_000);
    expect(isReady(s.crops[0]!, 10_999)).toBe(false);
    expect(isReady(s.crops[0]!, 11_000)).toBe(true);

    s = applyAction(s, { type: 'harvest', uid }, 11_000);
    expect(s.crops).toHaveLength(1);
    expect(s.crops[0]!.status).toBe('needsRequirement');
    expect(s.wheel.filled[0]).toBe(true);
  });
});

describe('wheel', () => {
  it('cannot spin with no filled slots', () => {
    const s0 = initialState();
    expect(applyAction(s0, { type: 'spin', roll: 0 }, 0)).toBe(s0);
  });

  it('a filled crop slot is a win and consumes the filled slots', () => {
    let s = growAndHarvestCarrot(initialState(), 0, 0);
    s = applyAction(s, { type: 'spin', roll: rollFor(0) }, 0);
    expect(s.lastSpin?.outcome).toBe('win');
    expect(s.progression.spinsRemaining).toBe(spinsRequired(1) - 1);
    expect(s.wheel.filled.every((f) => !f)).toBe(true);
  });

  it('an unfilled slot or the reset spot resets progress', () => {
    let s = growAndHarvestCarrot(initialState(), 0, 0);
    s = applyAction(s, { type: 'spin', roll: rollFor(0) }, 0);
    s = growAndHarvestCarrot(s, 1, 0);
    const afterMiss = applyAction(s, { type: 'spin', roll: rollFor(3) }, 0);
    expect(afterMiss.lastSpin?.outcome).toBe('reset');
    expect(afterMiss.progression.spinsRemaining).toBe(spinsRequired(1));
    const afterReset = applyAction(s, { type: 'spin', roll: rollFor(RESET_SPOT) }, 0);
    expect(afterReset.lastSpin?.outcome).toBe('reset');
  });

  it('the multiplier only pays out once all slots are filled', () => {
    let s = growAndHarvestCarrot(initialState(), 0, 0);
    expect(applyAction(s, { type: 'spin', roll: rollFor(MULTIPLIER_SPOT) }, 0).lastSpin?.outcome).toBe('reset');

    s = { ...s, progression: { level: 1, spinsRemaining: 10 }, wheel: { filled: Array(CROP_SLOTS).fill(true) } };
    s = applyAction(s, { type: 'spin', roll: rollFor(MULTIPLIER_SPOT) }, 0);
    expect(s.lastSpin?.outcome).toBe('multiplier');
    expect(s.progression.spinsRemaining).toBe(10 - multiplierBonus(1));
  });

  it('levels up when the required wins are reached', () => {
    let s = initialState();
    for (let i = 0; i < spinsRequired(1); i++) {
      s = growAndHarvestCarrot(s, i, i * 100_000);
      s = applyAction(s, { type: 'spin', roll: rollFor(0) }, 0);
    }
    expect(s.progression.level).toBe(2);
    expect(s.progression.spinsRemaining).toBe(spinsRequired(2));
    expect(s.lastSpin?.leveledUp).toBe(true);
  });
});

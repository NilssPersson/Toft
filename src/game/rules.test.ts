import { describe, expect, it } from 'vitest';
import { applyAction, initialState, isReady } from './rules.ts';
import {
  CROP_SLOTS,
  CROP_SPOTS,
  EMPTY_SPOT,
  ISLAND_SIZE,
  LEVEL_RECIPES,
  MULTIPLIER_SPOT,
  WHEEL_SPOTS,
  multiplierBonus,
  spinsRequired,
} from './config.ts';
import { canPlace } from './placement.ts';
import type { GameState, PlacedCrop } from './types.ts';

/** A roll that lands exactly in the middle of spot i. */
const rollFor = (i: number): number => (i + 0.5) / WHEEL_SPOTS;

function cropAt(state: GameState, index: number): PlacedCrop {
  const plot = state.crops.at(index);
  if (!plot) throw new Error(`No crop at index ${index}`);
  return plot;
}

/** Puts the player, standing still, on a cell. */
function standAt(state: GameState, x: number, z: number): GameState {
  return { ...state, player: { x, z, path: [], walkStartedAt: 0 } };
}

/** The spot that shows crop slot i. */
function cropSpot(slot: number): number {
  const spot = CROP_SPOTS[slot];
  if (spot === undefined) throw new Error(`No crop slot ${slot}`);
  return spot;
}

/** Plants a crop at (x, 0), waters it, waits and harvests it. */
function growAndHarvest(state: GameState, cropId: string, x: number): GameState {
  const planted = applyAction(standAt(state, x, 1), { type: 'place', cropId, x, z: 0 }, 0);
  const uid = cropAt(planted, -1).uid;
  const growing = applyAction(planted, { type: 'fulfil', uid }, 0);
  return applyAction(growing, { type: 'harvest', uid }, 1_000_000);
}

const allFilled = (): boolean[] => Array.from({ length: CROP_SLOTS }, () => true);

describe('grid', () => {
  it('rejects out-of-bounds and overlapping placements', () => {
    const state = applyAction(initialState(), { type: 'place', cropId: 'carrot', x: 0, z: 0 }, 0);
    expect(canPlace(state, { x: 0, z: 0, footprint: { w: 1, d: 1 } }, 0)).toBe(false);
    expect(canPlace(state, { x: ISLAND_SIZE - 1, z: ISLAND_SIZE - 1, footprint: { w: 1, d: 2 } }, 0)).toBe(false);
    expect(canPlace(state, { x: 1, z: 0, footprint: { w: 1, d: 1 } }, 0)).toBe(true);
  });

  it('does not place crops that are still locked', () => {
    const s0 = initialState();
    expect(applyAction(s0, { type: 'place', cropId: 'pumpkin', x: 0, z: 0 }, 0)).toBe(s0);
  });
});

describe('crop growth', () => {
  it('waits for its requirement, grows, and is not removed on harvest', () => {
    let state = applyAction(standAt(initialState(), 0, 1), { type: 'place', cropId: 'carrot', x: 0, z: 0 }, 0);
    const uid = cropAt(state, 0).uid;
    expect(applyAction(state, { type: 'harvest', uid }, 999_999)).toBe(state);

    state = applyAction(state, { type: 'fulfil', uid }, 1_000);
    expect(isReady(cropAt(state, 0), 10_999)).toBe(false);
    expect(isReady(cropAt(state, 0), 11_000)).toBe(true);

    state = applyAction(state, { type: 'harvest', uid }, 11_000);
    expect(state.crops).toHaveLength(1);
    expect(cropAt(state, 0).status).toBe('needsRequirement');
  });
});

describe('filling the wheel', () => {
  it('a harvest fills the first empty slot whose recipe needs that crop', () => {
    let state = growAndHarvest(initialState(), 'wheat', 0);
    expect(state.wheel.filled).toEqual([true, false, false, false, false, false]);
    state = growAndHarvest(state, 'wheat', 1);
    expect(state.wheel.filled).toEqual([true, true, false, false, false, false]);
  });

  it('a crop the recipe does not need fills nothing', () => {
    const state = growAndHarvest(initialState(), 'carrot', 0);
    expect(state.wheel.filled.some(Boolean)).toBe(false);
  });

  it("follows the level's recipe for the current win", () => {
    const secondSpin = { ...initialState(), progression: { level: 1, spinsRemaining: spinsRequired(1) - 1 } };
    const state = growAndHarvest(secondSpin, 'carrot', 0);
    const carrotSlot = LEVEL_RECIPES[0]?.[1]?.indexOf('carrot');
    expect(state.wheel.filled.findIndex(Boolean)).toBe(carrotSlot);
  });
});

describe('wheel', () => {
  it('cannot spin with no filled slots', () => {
    const s0 = initialState();
    expect(applyAction(s0, { type: 'spin', roll: 0 }, 0)).toBe(s0);
  });

  it('a filled crop slot is a win and consumes the filled slots', () => {
    let state = growAndHarvest(initialState(), 'wheat', 0);
    state = applyAction(state, { type: 'spin', roll: rollFor(cropSpot(0)) }, 0);
    expect(state.lastSpin?.outcome).toBe('win');
    expect(state.progression.spinsRemaining).toBe(spinsRequired(1) - 1);
    expect(state.wheel.filled.every((isFilled) => !isFilled)).toBe(true);
  });

  it.each([
    ['the empty spot', EMPTY_SPOT],
    ['an unfilled slot', cropSpot(5)],
    ['the multiplier before all slots are filled', MULTIPLIER_SPOT],
  ])("%s loses the filled slots but never the level's progress", (_name, spot) => {
    let state = growAndHarvest(initialState(), 'wheat', 0);
    state = applyAction(state, { type: 'spin', roll: rollFor(cropSpot(0)) }, 0);
    state = growAndHarvest(state, 'wheat', 1);
    const progression = state.progression;
    state = applyAction(state, { type: 'spin', roll: rollFor(spot) }, 0);
    expect(state.lastSpin).toMatchObject({ outcome: 'miss', progress: 0 });
    expect(state.progression).toEqual(progression);
    expect(state.progression.spinsRemaining).toBe(spinsRequired(1) - 1);
    expect(state.wheel.filled.some(Boolean)).toBe(false);
  });

  it('the multiplier only pays out once all slots are filled', () => {
    let state = growAndHarvest(initialState(), 'wheat', 0);
    expect(applyAction(state, { type: 'spin', roll: rollFor(MULTIPLIER_SPOT) }, 0).lastSpin?.outcome).toBe('miss');

    state = { ...state, progression: { level: 1, spinsRemaining: 4 }, wheel: { filled: allFilled() } };
    state = applyAction(state, { type: 'spin', roll: rollFor(MULTIPLIER_SPOT) }, 0);
    expect(state.lastSpin?.outcome).toBe('multiplier');
    expect(state.progression.spinsRemaining).toBe(4 - multiplierBonus(1));
  });

  it('levels up once every recipe of the level is won', () => {
    let state = initialState();
    for (let i = 0; i < spinsRequired(1); i++) {
      state = applyAction(
        { ...state, wheel: { filled: allFilled() } },
        { type: 'spin', roll: rollFor(cropSpot(0)) },
        0,
      );
    }
    expect(spinsRequired(1)).toBe(LEVEL_RECIPES[0]?.length);
    expect(state.progression.level).toBe(2);
    expect(state.progression.spinsRemaining).toBe(spinsRequired(2));
    expect(state.lastSpin?.leveledUp).toBe(true);
  });
});

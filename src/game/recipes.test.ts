import { describe, expect, it } from 'vitest';
import { CROP_SLOTS, LEVEL_RECIPES, getCrop, spinsRequired } from './config.ts';
import { currentRecipe, slotToFill, unlockedCrops } from './recipes.ts';

const PAST_WRITTEN_LEVEL = LEVEL_RECIPES.length + 3;

describe('written recipes', () => {
  it('each has one crop per slot, all unlocked by its level', () => {
    LEVEL_RECIPES.forEach((recipes, levelIndex) => {
      for (const recipe of recipes) {
        expect(recipe).toHaveLength(CROP_SLOTS);
        for (const cropId of recipe) expect(getCrop(cropId).unlockLevel).toBeLessThanOrEqual(levelIndex + 1);
      }
    });
  });

  it('level 1 starts with six wheat', () => {
    const recipe = currentRecipe({ level: 1, spinsRemaining: spinsRequired(1) });
    expect(recipe).toEqual(Array.from({ length: CROP_SLOTS }, () => 'wheat'));
  });
});

describe('generated recipes', () => {
  it('use only unlocked crops, and are the same every time', () => {
    const progression = { level: PAST_WRITTEN_LEVEL, spinsRemaining: 2 };
    const recipe = currentRecipe(progression);
    const unlocked = unlockedCrops(PAST_WRITTEN_LEVEL).map((crop) => crop.id);
    expect(recipe).toHaveLength(CROP_SLOTS);
    expect(recipe.every((cropId) => unlocked.includes(cropId))).toBe(true);
    expect(currentRecipe(progression)).toEqual(recipe);
  });
});

describe('slotToFill', () => {
  it('skips filled slots and returns -1 when none is left', () => {
    const recipe = ['wheat', 'carrot', 'wheat', 'carrot', 'wheat', 'carrot'];
    expect(slotToFill({ filled: [true, false, false, false, false, false] }, recipe, 'wheat')).toBe(2);
    expect(slotToFill({ filled: [true, false, true, false, true, false] }, recipe, 'wheat')).toBe(-1);
    expect(slotToFill({ filled: [false, false, false, false, false, false] }, recipe, 'lettuce')).toBe(-1);
  });
});

import { CROPS, CROP_SLOTS, LEVEL_RECIPES, spinsRequired } from './config.ts';
import type { Recipe } from './config.ts';
import type { CropDef, CropId, ProgressionState, WheelState } from './types.ts';

export function unlockedCrops(level: number): CropDef[] {
  return CROPS.filter((crop) => crop.unlockLevel <= level).sort(
    (first, second) => first.unlockLevel - second.unlockLevel,
  );
}

/** Wins so far in the current level, which is also the index of the recipe the next spin needs. */
export function winsThisLevel({ level, spinsRemaining }: ProgressionState): number {
  return Math.max(0, spinsRequired(level) - spinsRemaining);
}

/**
 * A recipe for a level past the written ones: the unlocked crops in turn, starting one further along with each win,
 * so every crop shows up and no two spins in a row look the same (see DESIGN.md "Open questions").
 */
function generatedRecipe(level: number, wins: number): Recipe {
  const crops = unlockedCrops(level);
  return Array.from({ length: CROP_SLOTS }, (_, i) => crops[(wins + i) % crops.length]?.id ?? '');
}

/** The crop each wheel slot needs for the next spin. */
export function currentRecipe(progression: ProgressionState): Recipe {
  const wins = winsThisLevel(progression);
  return LEVEL_RECIPES[progression.level - 1]?.[wins] ?? generatedRecipe(progression.level, wins);
}

/** The first empty slot that needs this crop, or -1 if none does. */
export function slotToFill(wheel: WheelState, recipe: Recipe, cropId: CropId): number {
  return recipe.findIndex((needed, slot) => needed === cropId && wheel.filled[slot] !== true);
}

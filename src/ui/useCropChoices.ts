import { CROPS } from '../game/index.ts';
import type { CropDef } from '../game/index.ts';
import { useStore } from '../state/store.ts';

export interface CropChoice {
  crop: CropDef;
  isUnlocked: boolean;
}

/** Every crop in unlock order, with whether the player's level has reached it. */
export function useCropChoices(): CropChoice[] {
  const level = useStore((state) => state.game.progression.level);
  return [...CROPS]
    .sort((first, second) => first.unlockLevel - second.unlockLevel)
    .map((crop) => ({ crop, isUnlocked: crop.unlockLevel <= level }));
}

/** Picking the selected crop again puts it down; locked crops can't be picked. */
export function useToggleCrop(): (choice: CropChoice) => void {
  const selectCrop = useStore((state) => state.selectCrop);
  return ({ crop, isUnlocked }) => {
    if (!isUnlocked) return;
    selectCrop(useStore.getState().selectedCrop === crop.id ? null : crop.id);
  };
}

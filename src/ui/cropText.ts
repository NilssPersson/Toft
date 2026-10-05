import type { CropDef } from '../game/index.ts';

/** Footprint and grow time, e.g. "1×2 · 30s". */
export function cropDetails(crop: CropDef): string {
  return `${crop.footprint.w}×${crop.footprint.d} · ${crop.growSeconds}s`;
}

/** Tooltip text for a crop slot or menu item. */
export function cropTitle(crop: CropDef, isUnlocked: boolean): string {
  if (!isUnlocked) return `${crop.name} · unlocks at level ${crop.unlockLevel}`;
  return `${crop.name} · ${cropDetails(crop)}`;
}

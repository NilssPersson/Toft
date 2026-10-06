// What the shop sells: crops and decorations as one list of items, so the shop and build mode treat them alike.
import { CROPS, DECORATIONS, rotatedFootprint } from '../game/index.ts';
import type { CropDef, DecorationDef, Footprint, Rotation } from '../game/index.ts';

export type ShopKind = 'crop' | 'decoration';

export interface ShopItem {
  kind: ShopKind;
  id: string;
  name: string;
  footprint: Footprint;
  unlockLevel: number;
  isRotatable: boolean;
  color: string;
  /** Crops only. */
  growSeconds: number | null;
}

function cropItem(crop: CropDef): ShopItem {
  const { id, name, footprint, unlockLevel, color, growSeconds } = crop;
  return { kind: 'crop', id, name, footprint, unlockLevel, isRotatable: false, color, growSeconds };
}

function decorationItem(decoration: DecorationDef): ShopItem {
  const { id, name, footprint, unlockLevel, isRotatable, color } = decoration;
  return { kind: 'decoration', id, name, footprint, unlockLevel, isRotatable, color, growSeconds: null };
}

function byUnlockLevel(first: ShopItem, second: ShopItem): number {
  return first.unlockLevel - second.unlockLevel;
}

/** Each shop tab's items, in unlock order. */
export const SHOP_ITEMS: Record<ShopKind, ShopItem[]> = {
  crop: CROPS.map(cropItem).sort(byUnlockLevel),
  decoration: DECORATIONS.map(decorationItem).sort(byUnlockLevel),
};

const ITEMS_BY_ID = new Map([...SHOP_ITEMS.crop, ...SHOP_ITEMS.decoration].map((item) => [item.id, item]));

export function shopItem(id: string): ShopItem | undefined {
  return ITEMS_BY_ID.get(id);
}

/** "1×2 · 30s" for a crop, "1×1" for a decoration. */
export function itemDetails(item: ShopItem): string {
  const size = `${item.footprint.w}×${item.footprint.d}`;
  return item.growSeconds === null ? size : `${size} · ${item.growSeconds}s`;
}

export function itemFootprint(item: ShopItem, rotation: Rotation): Footprint {
  return rotatedFootprint(item.footprint, rotation);
}

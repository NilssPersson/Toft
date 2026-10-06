import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyAction, growIsland, growLayout, initialState, migrateFromV1, wallsToDecorations } from '../game/index.ts';
import type { Action, GameState, GameStateV1, GameStateV3, GridCell, Rotation } from '../game/index.ts';
import { now, roll } from './clock.ts';
import type { ShopKind } from './shopItems.ts';

/** The panels that slide in from the left. Only one is open at a time. */
export type PanelId = 'wheel' | 'shop';

/** An item from the shop, shown as a ghost on the island until the player confirms or cancels it. */
export interface BuildDraft {
  kind: ShopKind;
  itemId: string;
  /** Top-left cell of the rotated footprint. */
  cell: GridCell;
  rotation: Rotation;
}

/**
 * The only bridge between the pure game rules and the app.
 * Game state changes exclusively through dispatch(action); UI-only state
 * (like the item being placed in build mode) lives alongside but separately.
 *
 * For multiplayer later, dispatch is the seam: send the action to a server,
 * and apply the authoritative state it sends back.
 */
interface StoreState {
  game: GameState;
  dispatch: (action: Action) => void;
  reset: () => void;

  /** Build mode: what is being placed and where. Never saved. */
  buildDraft: BuildDraft | null;
  setBuildDraft: (draft: BuildDraft | null) => void;

  /** The crop the player is walking to, to water or harvest it on arrival. */
  pendingCropUid: string | null;
  setPendingCrop: (uid: string | null) => void;

  /** The open left panel, if any. The wheel's stays open while the wheel turns. */
  openPanel: PanelId | null;
  isWheelSpinning: boolean;
  togglePanel: (panel: PanelId) => void;
  closePanel: () => void;
  setWheelSpinning: (isSpinning: boolean) => void;
}

/** Bump when GameState changes shape, and teach migrateSave the old shape. */
const SAVE_VERSION = 4;

interface Save {
  game: GameState;
}

/**
 * Upgrades an older save. Version 2 added the player and the walls; version 3 grew the island;
 * version 4 turned the walls into decorations.
 */
export function migrateSave(persisted: unknown, version: number): Save {
  const save = persisted as { game: GameState | GameStateV3 | GameStateV1 };
  if (version < 2) return { game: wallsToDecorations(migrateFromV1(growLayout(save.game))) };
  if (version < 3) return { game: wallsToDecorations(growIsland(save.game as GameStateV3)) };
  if (version < 4) return { game: wallsToDecorations(save.game as GameStateV3) };
  return save as Save;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      game: initialState(),
      dispatch: (action) => {
        const next = applyAction(get().game, action, now());
        if (next !== get().game) set({ game: next });
      },
      reset: () => set({ game: initialState(), buildDraft: null, pendingCropUid: null }),

      buildDraft: null,
      setBuildDraft: (draft) => set({ buildDraft: draft }),

      pendingCropUid: null,
      setPendingCrop: (uid) => set({ pendingCropUid: uid }),

      openPanel: null,
      isWheelSpinning: false,
      togglePanel: (panel) => {
        if (!get().isWheelSpinning) set({ openPanel: get().openPanel === panel ? null : panel });
      },
      closePanel: () => {
        if (!get().isWheelSpinning) set({ openPanel: null });
      },
      setWheelSpinning: (isSpinning) => set({ isWheelSpinning: isSpinning }),
    }),
    {
      name: 'toft-save',
      version: SAVE_VERSION,
      // Only the game itself is saved, never transient UI state.
      partialize: (state) => ({ game: state.game }),
      migrate: migrateSave,
    },
  ),
);

/** Convenience for spins: the roll is generated here, not inside the rules. */
export function spin(): void {
  useStore.getState().dispatch({ type: 'spin', roll: roll() });
}

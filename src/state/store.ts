import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyAction, initialState } from '../game/index.ts';
import type { Action, CropId, GameState } from '../game/index.ts';

/**
 * The only bridge between the pure game rules and the app.
 * Game state changes exclusively through dispatch(action); UI-only state
 * (like which crop is selected for placing) lives alongside but separately.
 *
 * For multiplayer later, dispatch is the seam: send the action to a server,
 * and apply the authoritative state it sends back.
 */
interface StoreState {
  game: GameState;
  dispatch: (action: Action) => void;
  reset: () => void;

  selectedCrop: CropId | null;
  selectCrop: (id: CropId | null) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      game: initialState(),
      dispatch: (action) => {
        const next = applyAction(get().game, action, Date.now());
        if (next !== get().game) set({ game: next });
      },
      reset: () => set({ game: initialState(), selectedCrop: null }),

      selectedCrop: null,
      selectCrop: (id) => set({ selectedCrop: id }),
    }),
    {
      name: 'toft-save',
      version: 1,
      // Only the game itself is saved, never transient UI state.
      partialize: (s) => ({ game: s.game }),
    },
  ),
);

/** Convenience for spins: the roll is generated here, not inside the rules. */
export function spin(): void {
  useStore.getState().dispatch({ type: 'spin', roll: Math.random() });
}

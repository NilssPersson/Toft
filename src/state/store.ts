import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyAction, initialState } from '../game/index.ts';
import type { Action, CropId, GameState } from '../game/index.ts';
import { now, roll } from './clock.ts';

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

  /** The side panel with the wheel. It stays open while the wheel turns. */
  isPanelOpen: boolean;
  isWheelSpinning: boolean;
  togglePanel: () => void;
  closePanel: () => void;
  setWheelSpinning: (isSpinning: boolean) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      game: initialState(),
      dispatch: (action) => {
        const next = applyAction(get().game, action, now());
        if (next !== get().game) set({ game: next });
      },
      reset: () => set({ game: initialState(), selectedCrop: null }),

      selectedCrop: null,
      selectCrop: (id) => set({ selectedCrop: id }),

      isPanelOpen: false,
      isWheelSpinning: false,
      togglePanel: () => {
        if (!get().isWheelSpinning) set({ isPanelOpen: !get().isPanelOpen });
      },
      closePanel: () => {
        if (!get().isWheelSpinning) set({ isPanelOpen: false });
      },
      setWheelSpinning: (isSpinning) => set({ isWheelSpinning: isSpinning }),
    }),
    {
      name: 'toft-save',
      version: 1,
      // Only the game itself is saved, never transient UI state.
      partialize: (state) => ({ game: state.game }),
    },
  ),
);

/** Convenience for spins: the roll is generated here, not inside the rules. */
export function spin(): void {
  useStore.getState().dispatch({ type: 'spin', roll: roll() });
}

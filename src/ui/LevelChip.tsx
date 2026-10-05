import type { ReactElement } from 'react';
import { useStore } from '../state/store.ts';
import { SIDE_PANEL_ID } from './SidePanel.tsx';

/** "Level N" in the top-left corner. Tapping it opens or closes the side panel; while open it reads as its heading. */
export function LevelChip(): ReactElement {
  const level = useStore((state) => state.game.progression.level);
  const isPanelOpen = useStore((state) => state.isPanelOpen);
  const togglePanel = useStore((state) => state.togglePanel);
  return (
    <button
      id="level-chip"
      className={`tile level-chip ${isPanelOpen ? 'is-open' : ''}`}
      onClick={togglePanel}
      aria-expanded={isPanelOpen}
      aria-controls={SIDE_PANEL_ID}
    >
      Level {level}
    </button>
  );
}

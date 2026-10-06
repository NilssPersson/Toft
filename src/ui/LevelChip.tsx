import type { ReactElement } from 'react';
import { useStore } from '../state/store.ts';
import { panelId } from './SidePanel.tsx';

/** "Level N" in the top-left corner. Tapping it opens or closes the ★ panel; while that is open it reads as its heading. */
export function LevelChip(): ReactElement {
  const level = useStore((state) => state.game.progression.level);
  const isWheelOpen = useStore((state) => state.openPanel === 'wheel');
  const togglePanel = useStore((state) => state.togglePanel);
  return (
    <button
      id="level-chip"
      className={`tile level-chip ${isWheelOpen ? 'is-open' : ''}`}
      onClick={() => togglePanel('wheel')}
      aria-expanded={isWheelOpen}
      aria-controls={panelId('wheel')}
    >
      Level {level}
    </button>
  );
}

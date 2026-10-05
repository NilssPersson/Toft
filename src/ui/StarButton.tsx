import type { ReactElement } from 'react';
import { canSpin } from '../game/index.ts';
import { useStore } from '../state/store.ts';
import { SIDE_PANEL_ID } from './SidePanel.tsx';

/** The ★ in the bottom-left corner opens and closes the side panel. Its badge says the wheel can spin. */
export function StarButton(): ReactElement {
  const isPanelOpen = useStore((state) => state.isPanelOpen);
  const togglePanel = useStore((state) => state.togglePanel);
  const isSpinReady = useStore((state) => canSpin(state.game.wheel));
  const label = isSpinReady ? 'Wheel (ready to spin)' : 'Wheel';
  return (
    <button
      className={`tile star-button ${isPanelOpen ? 'is-open' : ''}`}
      onClick={togglePanel}
      aria-expanded={isPanelOpen}
      aria-controls={SIDE_PANEL_ID}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">★</span>
      {isSpinReady && <span className="badge" data-testid="spin-badge" />}
    </button>
  );
}

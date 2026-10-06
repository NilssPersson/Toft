import type { ReactElement } from 'react';
import { canSpin } from '../game/index.ts';
import { useStore } from '../state/store.ts';
import { panelId } from './SidePanel.tsx';

/** The ★ in the bottom-left corner opens and closes the wheel's panel. Its badge says the wheel can spin. */
export function StarButton(): ReactElement {
  const isWheelOpen = useStore((state) => state.openPanel === 'wheel');
  const togglePanel = useStore((state) => state.togglePanel);
  const isSpinReady = useStore((state) => canSpin(state.game.wheel));
  const label = isSpinReady ? 'Wheel (ready to spin)' : 'Wheel';
  return (
    <button
      className={`tile star-button ${isWheelOpen ? 'is-open' : ''}`}
      onClick={() => togglePanel('wheel')}
      aria-expanded={isWheelOpen}
      aria-controls={panelId('wheel')}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">★</span>
      {isSpinReady && <span className="badge" data-testid="spin-badge" />}
    </button>
  );
}

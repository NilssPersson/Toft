import type { ReactElement } from 'react';
import { spinsRequired } from '../game/index.ts';
import { useStore } from '../state/store.ts';
import { Wheel } from './Wheel.tsx';

export const SIDE_PANEL_ID = 'side-panel';

function CloseButton(): ReactElement {
  const closePanel = useStore((state) => state.closePanel);
  const isWheelSpinning = useStore((state) => state.isWheelSpinning);
  return (
    <button className="tile close-button" onClick={closePanel} disabled={isWheelSpinning} aria-label="Close">
      <span aria-hidden="true">×</span>
    </button>
  );
}

function LevelProgress(): ReactElement {
  const { level, spinsRemaining } = useStore((state) => state.game.progression);
  const required = spinsRequired(level);
  const wins = required - spinsRemaining;
  return (
    <div className="level-progress">
      <div className="progress">
        <div className="progress-fill" style={{ width: `${(wins / required) * 100}%` }} />
      </div>
      <span className="progress-label">
        {wins} / {required} spins
      </span>
    </div>
  );
}

/**
 * Slides in from the left over the canvas; the island stays playable on the right.
 * Always mounted, so the wheel keeps its last result and the slide can animate. The level chip
 * and the ★ sit on top of it, in the spaces its header and last row leave free.
 */
export function SidePanel(): ReactElement {
  const level = useStore((state) => state.game.progression.level);
  const isOpen = useStore((state) => state.isPanelOpen);
  return (
    <aside
      id={SIDE_PANEL_ID}
      className={`side-panel ${isOpen ? 'is-open' : ''}`}
      aria-labelledby="side-panel-title"
      inert={!isOpen}
      data-state={isOpen ? 'open' : 'closed'}
    >
      <header className="side-panel-header">
        <h2 id="side-panel-title" className="visually-hidden">
          Level {level}
        </h2>
        <CloseButton />
      </header>
      <LevelProgress />
      <Wheel />
    </aside>
  );
}

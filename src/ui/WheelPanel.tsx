import type { ReactElement } from 'react';
import { spinsRequired } from '../game/index.ts';
import { useStore } from '../state/store.ts';
import { PanelCloseButton, SidePanel, panelTitleId } from './SidePanel.tsx';
import { Wheel } from './Wheel.tsx';

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

/** The ★ panel: level progress and the wheel. The level chip reads as its heading. */
export function WheelPanel(): ReactElement {
  const level = useStore((state) => state.game.progression.level);
  return (
    <SidePanel panel="wheel" className="wheel-panel">
      <header className="side-panel-header">
        <h2 id={panelTitleId('wheel')} className="visually-hidden">
          Level {level}
        </h2>
        <PanelCloseButton />
      </header>
      <LevelProgress />
      <Wheel />
    </SidePanel>
  );
}

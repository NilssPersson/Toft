import type { ReactElement, ReactNode } from 'react';
import { useStore } from '../state/store.ts';
import type { PanelId } from '../state/store.ts';

export function panelId(panel: PanelId): string {
  return `${panel}-panel`;
}

export function panelTitleId(panel: PanelId): string {
  return `${panel}-panel-title`;
}

export function PanelCloseButton(): ReactElement {
  const closePanel = useStore((state) => state.closePanel);
  const isWheelSpinning = useStore((state) => state.isWheelSpinning);
  return (
    <button className="tile close-button" onClick={closePanel} disabled={isWheelSpinning} aria-label="Close">
      <span aria-hidden="true">×</span>
    </button>
  );
}

interface SidePanelProps {
  panel: PanelId;
  /** Extra class for the panel's own layout. */
  className: string;
  children: ReactNode;
}

/**
 * Slides in from the left over the canvas; the island stays playable on the right. Only one is open at a time.
 * Always mounted, so a panel keeps its state and the slide can animate. Its heading is the element with
 * `panelTitleId(panel)`. The level chip and the ★ sit on top, in the spaces its header and last row leave free.
 */
export function SidePanel({ panel, className, children }: SidePanelProps): ReactElement {
  const isOpen = useStore((state) => state.openPanel === panel);
  return (
    <aside
      id={panelId(panel)}
      className={`side-panel ${className} ${isOpen ? 'is-open' : ''}`}
      aria-labelledby={panelTitleId(panel)}
      inert={!isOpen}
      data-state={isOpen ? 'open' : 'closed'}
    >
      {children}
    </aside>
  );
}

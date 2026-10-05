import type { ReactElement } from 'react';
import { useStore } from '../state/store.ts';
import { usePopover } from './usePopover.ts';

const GEAR_PATH =
  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13a7.5 7.5 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-1.7-1L15 3.5h-4L10.6 6a7.5 7.5 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 1.7-1l2.4 1 2-3.4z';

function GearIcon(): ReactElement {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d={GEAR_PATH} />
    </svg>
  );
}

function NewIslandButton({ onDone }: { onDone: () => void }): ReactElement {
  const reset = useStore((state) => state.reset);
  const onClick = (): void => {
    if (window.confirm('Start a fresh island? This clears your save.')) reset();
    onDone();
  };
  return (
    <button className="menu-item" role="menuitem" onClick={onClick}>
      New island
    </button>
  );
}

/** The gear in the top-right corner. Its menu is the home for settings such as sound. */
export function SettingsMenu(): ReactElement {
  const { isOpen, toggle, close, containerRef } = usePopover();
  return (
    <div className="menu" ref={containerRef}>
      <button
        className="tile"
        onClick={toggle}
        aria-label="Settings"
        title="Settings"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <GearIcon />
      </button>
      {isOpen && (
        <div className="panel popover" role="menu" aria-label="Settings">
          <NewIslandButton onDone={close} />
        </div>
      )}
    </div>
  );
}

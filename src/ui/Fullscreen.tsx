import { useEffect, useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';
import {
  canFullscreen,
  enterFullscreen,
  isFullscreen,
  isInstalledApp,
  subscribeToFullscreen,
  toggleFullscreen,
} from '../pwa/fullscreen.ts';

const FIRST_INTERACTION_EVENTS = ['pointerup', 'keydown'] as const;
const ENTER_ICON = 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5';
const EXIT_ICON = 'M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5';

/** Esc can't grant fullscreen (it is how the player leaves it), so it doesn't count as the first interaction. */
function isActivatingEvent(event: Event): boolean {
  return !(event instanceof KeyboardEvent && event.key === 'Escape');
}

/** In a browser tab, goes fullscreen on the player's first click, tap or key press. */
export function useFullscreenOnFirstInteraction(): void {
  useEffect(() => {
    if (isInstalledApp() || !canFullscreen()) return;
    const onInteraction = (event: Event): void => {
      if (!isActivatingEvent(event)) return;
      removeListeners();
      enterFullscreen();
    };
    const removeListeners = (): void => {
      FIRST_INTERACTION_EVENTS.forEach((type) => {
        window.removeEventListener(type, onInteraction);
      });
    };
    FIRST_INTERACTION_EVENTS.forEach((type) => {
      window.addEventListener(type, onInteraction);
    });
    return removeListeners;
  }, []);
}

function useIsFullscreen(): boolean {
  return useSyncExternalStore(subscribeToFullscreen, isFullscreen, () => false);
}

function FullscreenIcon({ isOn }: { isOn: boolean }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d={isOn ? EXIT_ICON : ENTER_ICON} />
    </svg>
  );
}

/** HUD button that toggles fullscreen. Hidden where the Fullscreen API is missing, such as Safari on iPhone. */
export function FullscreenButton(): ReactElement | null {
  const isOn = useIsFullscreen();
  if (!canFullscreen()) return null;
  return (
    <button
      className="panel fullscreen-toggle"
      onClick={toggleFullscreen}
      aria-label={isOn ? 'Exit fullscreen' : 'Enter fullscreen'}
      title={isOn ? 'Exit fullscreen' : 'Fullscreen'}
    >
      <FullscreenIcon isOn={isOn} />
    </button>
  );
}

import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { useStore } from '../state/store.ts';

/** Remembers the welcome hint apart from the save: it is UI, not game state. */
const WELCOME_SEEN_KEY = 'toft-welcome-seen';
const WELCOME_MS = 8000;
const PLACING_TEXT = 'Tap the island to plant · Esc to stop';
const WELCOME_TEXT = 'Tap to walk · buy crops from the basket · tap blue to water, yellow to harvest';

function hasSeenWelcome(): boolean {
  try {
    return localStorage.getItem(WELCOME_SEEN_KEY) !== null;
  } catch {
    return true;
  }
}

function rememberWelcome(): void {
  try {
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
  } catch {
    // Without storage the welcome may show again next visit; that's fine.
  }
}

/** True for a few seconds on a player's very first visit. */
function useWelcome(): boolean {
  const [isShowing, setShowing] = useState(() => !hasSeenWelcome());
  useEffect(() => {
    if (!isShowing) return;
    rememberWelcome();
    const timer = window.setTimeout(() => setShowing(false), WELCOME_MS);
    return () => window.clearTimeout(timer);
  }, [isShowing]);
  return isShowing;
}

/** A small note at the bottom: how to plant while a crop is picked, and a welcome on the first visit. */
export function HintToast(): ReactElement | null {
  const isPlacing = useStore((state) => state.selectedCrop !== null);
  const isWelcome = useWelcome();
  if (!isPlacing && !isWelcome) return null;
  return (
    <div className="panel hint-toast" role="status">
      {isPlacing ? PLACING_TEXT : WELCOME_TEXT}
    </div>
  );
}

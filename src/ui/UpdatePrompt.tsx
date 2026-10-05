import { useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';
import { hasUpdateWaiting, restartIntoUpdate, subscribeToUpdates } from '../pwa/serviceWorker.ts';

/** Offers a new version once it is installed. Only the player's tap reloads; the save survives in localStorage. */
export function UpdatePrompt(): ReactElement | null {
  const isUpdateWaiting = useSyncExternalStore(subscribeToUpdates, hasUpdateWaiting, () => false);
  if (!isUpdateWaiting) return null;
  return (
    <div className="panel update-prompt" role="status">
      Update available
      <button className="spin-button" onClick={restartIntoUpdate}>
        Restart
      </button>
    </div>
  );
}

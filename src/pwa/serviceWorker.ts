// Service worker registration for /play. Imported only from the game bundle, never from marketing pages.
// A new version waits until the player restarts: the game is never reloaded mid-play.
import { Workbox } from 'workbox-window';

const SERVICE_WORKER_URL = '/sw.js';

let workbox: Workbox | undefined;
let isUpdateWaiting = false;
const updateListeners = new Set<() => void>();

function markUpdateWaiting(): void {
  isUpdateWaiting = true;
  updateListeners.forEach((listener) => {
    listener();
  });
}

/** Registers /sw.js once, in production builds only. Fails silently. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || workbox !== undefined || !('serviceWorker' in navigator)) return;
  workbox = new Workbox(SERVICE_WORKER_URL);
  workbox.addEventListener('waiting', markUpdateWaiting);
  workbox.register().catch(() => undefined);
}

/** True once a new version is installed and waiting for a restart. */
export function hasUpdateWaiting(): boolean {
  return isUpdateWaiting;
}

export function subscribeToUpdates(listener: () => void): () => void {
  updateListeners.add(listener);
  return () => {
    updateListeners.delete(listener);
  };
}

/** Activates the waiting version and reloads once it controls the page. Only on the player's request. */
export function restartIntoUpdate(): void {
  if (workbox === undefined) return;
  workbox.addEventListener('controlling', () => {
    window.location.reload();
  });
  workbox.messageSkipWaiting();
}

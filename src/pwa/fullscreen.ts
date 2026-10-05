// Fullscreen helpers for /play. Browsers only allow fullscreen from a user gesture,
// and every request may be refused, so failures are ignored.

const INSTALLED_DISPLAY_MODES = ['(display-mode: fullscreen)', '(display-mode: standalone)'];

/** iOS Safari's flag for a page launched from the home screen. */
interface IosNavigator extends Navigator {
  standalone?: boolean;
}

/** The Fullscreen API is missing altogether on some browsers, whatever the DOM types say. */
interface MaybeFullscreenDocument {
  fullscreenEnabled?: boolean;
}

/** True when running as an installed app, which already has the whole screen. */
export function isInstalledApp(): boolean {
  const isIosHomeScreenApp = (navigator as IosNavigator).standalone === true;
  return isIosHomeScreenApp || INSTALLED_DISPLAY_MODES.some((query) => window.matchMedia(query).matches);
}

/** False where the Fullscreen API is missing, such as Safari on iPhone. */
export function canFullscreen(): boolean {
  const maybeFullscreen: MaybeFullscreenDocument = document;
  return maybeFullscreen.fullscreenEnabled === true;
}

export function isFullscreen(): boolean {
  return document.fullscreenElement !== null;
}

export function enterFullscreen(): void {
  if (!canFullscreen() || isFullscreen()) return;
  document.documentElement.requestFullscreen().catch(() => undefined);
}

export function exitFullscreen(): void {
  if (!isFullscreen()) return;
  document.exitFullscreen().catch(() => undefined);
}

export function toggleFullscreen(): void {
  if (isFullscreen()) exitFullscreen();
  else enterFullscreen();
}

export function subscribeToFullscreen(listener: () => void): () => void {
  document.addEventListener('fullscreenchange', listener);
  return () => {
    document.removeEventListener('fullscreenchange', listener);
  };
}

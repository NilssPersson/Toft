// Landscape lock for /play on phones. Browsers only lock the screen inside fullscreen and iOS can't lock it at all,
// so every failure is ignored; the rotate screen in styles.css covers whatever the lock can't.

import { isFullscreen, subscribeToFullscreen } from './fullscreen.ts';

/** Phones in landscape are under about 500 CSS px tall; tablets and desktops are taller and are never locked. */
const PHONE_MAX_SHORT_SIDE = 500;
const COARSE_POINTER = '(pointer: coarse)';

/** `lock` is missing from TypeScript's DOM types, and from iOS Safari altogether. */
interface LockableOrientation extends ScreenOrientation {
  lock?: (orientation: 'landscape') => Promise<void>;
}

/** Older Safari has no `screen.orientation` at all, whatever the DOM types say. */
interface MaybeOrientationScreen {
  orientation?: LockableOrientation;
}

function screenOrientation(): LockableOrientation | undefined {
  const maybeOrientationScreen: MaybeOrientationScreen = screen;
  return maybeOrientationScreen.orientation;
}

export function canLockOrientation(): boolean {
  return typeof screenOrientation()?.lock === 'function';
}

/** Asks for landscape. Refused outside fullscreen and on iOS, which is fine: the rotate screen takes over. */
export function lockLandscape(): void {
  if (!canLockOrientation()) return;
  screenOrientation()
    ?.lock?.('landscape')
    .catch(() => undefined);
}

/** A touch screen whose short side is phone-sized. */
export function isPhone(): boolean {
  const shortSide = Math.min(screen.width, screen.height);
  return window.matchMedia(COARSE_POINTER).matches && shortSide < PHONE_MAX_SHORT_SIDE;
}

function lockLandscapeOnEnteringFullscreen(): void {
  if (isFullscreen() && isPhone()) lockLandscape();
}

/**
 * Locks phones to landscape each time they enter fullscreen, from the first tap or the HUD toggle alike.
 * Leaving fullscreen releases the lock by itself. Returns the unsubscribe function.
 */
export function lockLandscapeInFullscreen(): () => void {
  return subscribeToFullscreen(lockLandscapeOnEnteringFullscreen);
}

import type { ReactElement } from 'react';

/** A phone outline turning from portrait to landscape. */
const PHONE_PATH = 'M17 6h14a3 3 0 0 1 3 3v30a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zM22 37h4';
const TURN_ARROW_PATH = 'M38 14a14 14 0 0 1 4 12M42 26l-4-2M42 26l2-4';

function RotatePhoneIcon(): ReactElement {
  return (
    <svg className="rotate-icon" viewBox="0 0 48 48" width="96" height="96" aria-hidden="true">
      <path className="rotate-phone" d={PHONE_PATH} />
      <path d={TURN_ARROW_PATH} />
    </svg>
  );
}

/**
 * Covers the game on a phone held upright, where the landscape lock is refused or missing (iOS).
 * Rendered always; the media query in styles.css shows it, so rotating needs no re-render.
 * It catches every touch, which keeps the canvas and HUD underneath out of reach; the game itself keeps running.
 */
export function RotateScreen(): ReactElement {
  return (
    <div className="rotate-screen" role="alert">
      <RotatePhoneIcon />
      <p>Turn your phone sideways to play</p>
    </div>
  );
}

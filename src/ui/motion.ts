const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** True when the player (or a test) asks for reduced motion: HUD animations then finish at once. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION).matches;
}

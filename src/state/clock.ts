// Where the app gets `now` and `roll` for the game rules. Real time and randomness by default;
// the test hook (src/testing/testHook.ts) swaps in its own so tests control both.

interface Sources {
  now: () => number;
  roll: () => number;
}

const sources: Sources = { now: () => Date.now(), roll: () => Math.random() };

/** Epoch ms to pass to the rules as `now`. */
export function now(): number {
  return sources.now();
}

/** A number in [0, 1) to pass to the rules as a spin's `roll`. */
export function roll(): number {
  return sources.roll();
}

/** Replaces either source. Only tests do this. */
export function setSources(overrides: Partial<Sources>): void {
  Object.assign(sources, overrides);
}

// Seeded randomness for the grass, so the island looks the same on every load and in every screenshot.

const UINT32 = 2 ** 32;

/** A small, fast generator (mulberry32): the same seed always gives the same sequence in [0, 1). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32;
  };
}

/** A repeatable value in [0, 1) for a grid point: the same point and seed always give the same value. */
export function hashPoint(x: number, z: number, seed: number): number {
  let hash = Math.imul(x, 0x27d4eb2d) ^ Math.imul(z, 0x165667b1) ^ Math.imul(seed, 0x9e3779b1);
  hash = Math.imul(hash ^ (hash >>> 15), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return ((hash ^ (hash >>> 16)) >>> 0) / UINT32;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const amount = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return amount * amount * (3 - 2 * amount);
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

/** Smooth value noise in [0, 1): random heights on a unit lattice, blended smoothly in between. */
export function valueNoise(x: number, z: number, seed: number): number {
  const cellX = Math.floor(x);
  const cellZ = Math.floor(z);
  const blendX = smoothstep(0, 1, x - cellX);
  const blendZ = smoothstep(0, 1, z - cellZ);
  const top = lerp(hashPoint(cellX, cellZ, seed), hashPoint(cellX + 1, cellZ, seed), blendX);
  const bottom = lerp(hashPoint(cellX, cellZ + 1, seed), hashPoint(cellX + 1, cellZ + 1, seed), blendX);
  return lerp(top, bottom, blendZ);
}

export { lerp, smoothstep };

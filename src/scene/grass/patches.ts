// Large, soft patches of lighter and darker green across the lawn, darkening toward its edges.
// Sampled in world space and never repeated, so they also hide the detail texture's tiling.
import { GRASS } from './config.ts';
import type { Tint } from './config.ts';
import { lerp, smoothstep, valueNoise } from './random.ts';

/** A second, finer octave adds a little irregularity to the patch outlines. */
const DETAIL_OCTAVE_SCALE = 2.3;
const DETAIL_OCTAVE_WEIGHT = 0.35;
const DETAIL_OCTAVE_SEED_OFFSET = 7;

/** How sunny (1) or shady (0) the lawn is at a world point. */
export function patchAmount(worldX: number, worldZ: number): number {
  const { scale } = GRASS.patches;
  const broad = valueNoise(worldX / scale, worldZ / scale, GRASS.seed);
  const fineScale = scale / DETAIL_OCTAVE_SCALE;
  const fine = valueNoise(worldX / fineScale, worldZ / fineScale, GRASS.seed + DETAIL_OCTAVE_SEED_OFFSET);
  return smoothstep(0.2, 0.8, lerp(broad, fine, DETAIL_OCTAVE_WEIGHT));
}

/** The width of the whole lawn: the playable cells plus the verge around them. */
export function lawnWidth(islandSize: number): number {
  return islandSize + GRASS.lip.verge * 2;
}

/** 1 in the middle of the lawn, falling to `edgeShade` at its edge, so the island reads as a raised lawn. */
export function edgeShade(worldX: number, worldZ: number, islandSize: number): number {
  const { edgeShade: shadeAtEdge, edgeWidth } = GRASS.patches;
  const distanceToEdge = lawnWidth(islandSize) / 2 - Math.max(Math.abs(worldX), Math.abs(worldZ));
  return lerp(shadeAtEdge, 1, smoothstep(0, edgeWidth, distanceToEdge));
}

/** The colour multiplier for the lawn at a world point: patch colour times edge shade. */
export function groundTint(worldX: number, worldZ: number, islandSize: number): Tint {
  const { warm, cool } = GRASS.patches;
  const amount = patchAmount(worldX, worldZ);
  const shade = edgeShade(worldX, worldZ, islandSize);
  return [
    lerp(cool[0], warm[0], amount) * shade,
    lerp(cool[1], warm[1], amount) * shade,
    lerp(cool[2], warm[2], amount) * shade,
  ];
}

// Tuning for the cartoon sea around the island. All distances are in world units (1 per cell).

export interface OceanConfig {
  /** Width of the square sea plane, and how many segments it has per side for the swell. */
  size: number;
  segments: number;
  /** Height of the calm water surface; the island's soil sides dip into it. */
  level: number;
  colors: {
    shallow: string;
    deep: string;
    foam: string;
  };
  /** The water darkens in this many flat bands over `reach` units from the shore. */
  depth: { bands: number; reach: number };
  /** The white rim lapping at the shore: how wide it is, how far it wobbles and how fast. */
  shoreFoam: { width: number; wobble: number; speed: number };
  /** Thin foam rings rolling out from the shore and fading by `reach`. */
  ripples: { spacing: number; width: number; speed: number; reach: number };
  /** Little white arcs that pop up across open water: one per `spacing` square, from `minDistance` out. */
  crests: { spacing: number; radius: number; width: number; speed: number; minDistance: number };
  /** A slow up-and-down swell of the whole surface. */
  swell: { height: number; length: number; speed: number };
}

export const OCEAN: OceanConfig = {
  size: 200,
  segments: 96,
  level: -0.6,
  colors: {
    shallow: '#86d9d4',
    deep: '#3b85bf',
    foam: '#f4fbff',
  },
  depth: { bands: 4, reach: 9 },
  shoreFoam: { width: 0.2, wobble: 0.09, speed: 1.3 },
  ripples: { spacing: 1.6, width: 0.12, speed: 0.35, reach: 4.5 },
  crests: { spacing: 4.5, radius: 0.55, width: 0.12, speed: 0.6, minDistance: 2.5 },
  swell: { height: 0.05, length: 7, speed: 0.8 },
};

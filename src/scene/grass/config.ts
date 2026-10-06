// Visual tuning for the grass. This is how the lawn looks, not how the game plays, so it stays out of src/game.

export type Tint = [number, number, number];

export interface GrassConfig {
  /** Seeds every random choice, so the lawn looks the same on every load. */
  seed: number;
  texture: {
    /** Side of the square detail texture, in pixels. */
    size: number;
    baseColor: string;
    /** Short blade strokes drawn over the base, slightly darker or lighter than it. */
    bladeCount: number;
    bladeLength: [number, number];
    bladeColors: string[];
    /** Per-pixel brightness noise, as a fraction of full brightness either way. */
    noiseAmount: number;
    /** How many times the texture repeats along one grid cell. */
    repeatPerCell: number;
  };
  patches: {
    /** Size of one noise patch, in cells. */
    scale: number;
    /** Multipliers on the texture colour: sunny, yellower patches and shady, bluer ones. */
    warm: Tint;
    cool: Tint;
    /** Brightness at the very edge of the lawn, fading to full over `edgeWidth` cells. */
    edgeShade: number;
    edgeWidth: number;
    /** Ground vertices per cell along each side; the patches are smooth across them. */
    verticesPerCell: number;
  };
  tufts: {
    perCell: number;
    /** Most tufts on the island; phones get half. */
    maxCount: number;
    height: [number, number];
    bladeWidth: number;
    /** Brightness at the root of a blade relative to its tip, which reads as the tuft's own shade. */
    rootShade: number;
    tipColors: [string, string];
    /** How far a blade tip moves in the wind, in world units, and how fast. */
    swayStrength: number;
    swaySpeed: number;
  };
  lip: {
    color: string;
    /** How far the lawn reaches past the playable cells on each side, as a verge nobody plants on. */
    verge: number;
    /** How far the turf reaches past the island body on each side, and how thick it is. */
    overhang: number;
    thickness: number;
  };
}

export const GRASS: GrassConfig = {
  seed: 20261006,
  texture: {
    size: 256,
    baseColor: '#7fc25a',
    bladeCount: 1400,
    bladeLength: [5, 12],
    bladeColors: ['#72b44f', '#8ccd66', '#78ba54', '#93d16c'],
    noiseAmount: 0.035,
    repeatPerCell: 1.5,
  },
  patches: {
    scale: 3.5,
    warm: [1.07, 1.06, 0.84],
    cool: [0.86, 0.94, 1.0],
    edgeShade: 0.8,
    edgeWidth: 1.5,
    verticesPerCell: 4,
  },
  tufts: {
    perCell: 4,
    maxCount: 600,
    height: [0.14, 0.26],
    bladeWidth: 0.08,
    rootShade: 0.55,
    tipColors: ['#86c75c', '#a2d46a'],
    swayStrength: 0.04,
    swaySpeed: 1.6,
  },
  lip: {
    color: '#5f9a43',
    verge: 0.36,
    overhang: 0.06,
    thickness: 0.12,
  },
};

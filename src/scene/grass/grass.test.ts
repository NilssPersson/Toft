import { describe, expect, it } from 'vitest';
import { GRASS } from './config.ts';
import { edgeShade, groundTint, lawnWidth, patchAmount } from './patches.ts';
import { seededRandom, valueNoise } from './random.ts';
import { scatterTufts, tuftsPerCell } from './scatter.ts';

const ISLAND_SIZE = 12;

describe('seededRandom', () => {
  it('gives the same sequence for the same seed, in [0, 1)', () => {
    const first = seededRandom(42);
    const second = seededRandom(42);
    const values = Array.from({ length: 100 }, () => first());
    expect(values).toEqual(Array.from({ length: 100 }, () => second()));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new Set(values).size).toBe(100);
  });

  it('gives a different sequence for a different seed', () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });
});

describe('valueNoise', () => {
  it('is smooth: nearby points have nearby values', () => {
    expect(Math.abs(valueNoise(3.5, 2.5, 7) - valueNoise(3.51, 2.5, 7))).toBeLessThan(0.05);
  });
});

describe('lawn patches', () => {
  it('vary across the island', () => {
    const samples = Array.from({ length: ISLAND_SIZE }, (_, i) => patchAmount(i - 6, 6 - i));
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.3);
  });

  it('darken toward the edge of the lawn', () => {
    expect(edgeShade(0, 0, ISLAND_SIZE)).toBe(1);
    expect(edgeShade(lawnWidth(ISLAND_SIZE) / 2, 0, ISLAND_SIZE)).toBeCloseTo(GRASS.patches.edgeShade);
    expect(groundTint(0, ISLAND_SIZE / 2, ISLAND_SIZE)[1]).toBeLessThan(groundTint(0, 0, ISLAND_SIZE)[1]);
  });
});

describe('scatterTufts', () => {
  const lawn = { islandSize: ISLAND_SIZE, blocked: new Set<string>(), perCell: 2 };

  it('puts the same tufts in the same places every time', () => {
    expect(scatterTufts(lawn)).toEqual(scatterTufts(lawn));
    expect(scatterTufts(lawn)).toHaveLength(ISLAND_SIZE * ISLAND_SIZE * 2);
  });

  it('skips blocked cells and leaves every other tuft where it was', () => {
    const all = scatterTufts(lawn);
    const withCrop = scatterTufts({ ...lawn, blocked: new Set(['0,0']) });
    const inFirstCell = (tuft: { x: number; z: number }): boolean => tuft.x < 1 - 6 && tuft.z < 1 - 6;
    expect(withCrop.some(inFirstCell)).toBe(false);
    expect(withCrop).toEqual(all.filter((tuft) => !inFirstCell(tuft)));
  });

  it('keeps the island within the tuft cap', () => {
    expect(tuftsPerCell(ISLAND_SIZE, GRASS.tufts.maxCount) * ISLAND_SIZE ** 2).toBeLessThanOrEqual(
      GRASS.tufts.maxCount,
    );
    expect(tuftsPerCell(ISLAND_SIZE, GRASS.tufts.maxCount / 2)).toBeLessThan(
      tuftsPerCell(ISLAND_SIZE, GRASS.tufts.maxCount),
    );
  });
});

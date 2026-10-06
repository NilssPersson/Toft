import { describe, expect, it } from 'vitest';
import { fenceRails } from './fenceRails.ts';

describe('fenceRails', () => {
  it('runs along its rotation when no fence is next to it', () => {
    expect(fenceRails({ x: 2, z: 2 }, new Set(), 0)).toEqual(['east', 'west']);
    expect(fenceRails({ x: 2, z: 2 }, new Set(['5,5']), 90)).toEqual(['north', 'south']);
  });

  it('joins every neighbouring fence, whatever its rotation', () => {
    expect(fenceRails({ x: 2, z: 2 }, new Set(['3,2', '2,1']), 0)).toEqual(['east', 'north']);
  });
});

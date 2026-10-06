import { cellKey } from '../../game/index.ts';
import type { GridCell, Rotation } from '../../game/index.ts';

/** The sides of a cell, as grid steps: +x, +z, −x, −z. */
export type Side = 'east' | 'south' | 'west' | 'north';

export const SIDE_STEPS: Record<Side, GridCell> = {
  east: { x: 1, z: 0 },
  south: { x: 0, z: 1 },
  west: { x: -1, z: 0 },
  north: { x: 0, z: -1 },
};

const SIDES: Side[] = ['east', 'south', 'west', 'north'];

/** A fence on its own runs along x at rotation 0 and 180, along z at 90 and 270. */
function sidesAlong(rotation: Rotation): Side[] {
  return rotation === 0 || rotation === 180 ? ['east', 'west'] : ['north', 'south'];
}

/**
 * Which sides a fence's rails run to: towards every neighbouring fence, so fences join up into one line,
 * or along its own rotation when no fence is next to it.
 */
export function fenceRails(cell: GridCell, fenceCells: Set<string>, rotation: Rotation): Side[] {
  const joined = SIDES.filter((side) => {
    const step = SIDE_STEPS[side];
    return fenceCells.has(cellKey({ x: cell.x + step.x, z: cell.z + step.z }));
  });
  return joined.length > 0 ? joined : sidesAlong(rotation);
}

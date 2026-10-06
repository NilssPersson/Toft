import { STONE_WALL_ID } from './config.ts';
import type { GridCell, PlacedDecoration } from './types.ts';

/** Stone walls on these cells, for a new island or an old save's walls. Their uids never clash with built ones. */
export function stoneWallsAt(cells: GridCell[]): PlacedDecoration[] {
  return cells.map(({ x, z }, i) => ({ uid: `w${i + 1}`, decorationId: STONE_WALL_ID, x, z, rotation: 0 }));
}

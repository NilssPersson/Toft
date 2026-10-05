import { WALK_CELLS_PER_SECOND } from './config.ts';
import { cellOf, distanceBetween, findPath, nearestCellNextTo } from './path.ts';
import type { GameState, GridCell, IslandPoint, PlacedCrop, PlayerState } from './types.ts';

const MS_PER_CELL = 1000 / WALK_CELLS_PER_SECOND;

type WithPlayer = Pick<GameState, 'player'>;

/** The distance, in cells, covered by the walk so far at `now`. */
function distanceWalked(player: PlayerState, now: number): number {
  return Math.max(0, now - player.walkStartedAt) / MS_PER_CELL;
}

function walkLength({ x, z, path }: PlayerState): number {
  let length = 0;
  let from: IslandPoint = { x, z };
  for (const to of path) {
    length += distanceBetween(from, to);
    from = to;
  }
  return length;
}

function pointBetween(from: IslandPoint, to: IslandPoint, along: number): IslandPoint {
  return { x: from.x + (to.x - from.x) * along, z: from.z + (to.z - from.z) * along };
}

/** Where the player is at `now`, in cell units, moving at an even pace along its path. */
export function playerPosition(state: WithPlayer, now: number): IslandPoint {
  const { player } = state;
  let left = distanceWalked(player, now);
  let from: IslandPoint = { x: player.x, z: player.z };
  for (const to of player.path) {
    const leg = distanceBetween(from, to);
    if (left < leg) return pointBetween(from, to, left / leg);
    left -= leg;
    from = to;
  }
  return from;
}

/** The cell the player is in at `now`. */
export function playerCell(state: WithPlayer, now: number): GridCell {
  return cellOf(playerPosition(state, now));
}

export function isWalking(state: WithPlayer, now: number): boolean {
  return distanceWalked(state.player, now) < walkLength(state.player);
}

/** A walk to `to`, starting at `now` from wherever the player is, even mid-walk. Undefined if unreachable. */
export function walkTo(state: GameState, to: IslandPoint, now: number): PlayerState | undefined {
  const from = playerPosition(state, now);
  const path = findPath(state, from, to);
  return path && { ...from, path, walkStartedAt: now };
}

/** The open cell next to a plot the player can reach soonest; undefined if there is none. */
export function approachCell(state: GameState, plot: PlacedCrop, now: number): GridCell | undefined {
  return nearestCellNextTo(state, playerCell(state, now), plot);
}

import { WALK_CELLS_PER_SECOND } from './config.ts';
import { blockedCells, cellKey, isOnIsland, isSameCell, plotCells } from './grid.ts';
import type { GameState, GridCell, PlacedCrop, PlayerState } from './types.ts';

/** Up, right, down, left: a fixed order, so the same grid always gives the same path. */
const NEIGHBOUR_OFFSETS: readonly GridCell[] = [
  { x: 0, z: -1 },
  { x: 1, z: 0 },
  { x: 0, z: 1 },
  { x: -1, z: 0 },
];

const STEP_MS = 1000 / WALK_CELLS_PER_SECOND;

type Island = Pick<GameState, 'islandSize' | 'crops' | 'walls'>;

/** How far along its path the player is at `now`, in steps from the start of the walk. */
interface WalkProgress {
  /** The number of cells fully reached. */
  stepsDone: number;
  /** True while between two cells. */
  isMidStep: boolean;
}

function neighbours(cell: GridCell): GridCell[] {
  return NEIGHBOUR_OFFSETS.map((offset) => ({ x: cell.x + offset.x, z: cell.z + offset.z }));
}

function openCellCheck(island: Island): (cell: GridCell) => boolean {
  const blocked = blockedCells(island);
  return (cell) => isOnIsland(cell, island.islandSize) && !blocked.has(cellKey(cell));
}

/** Follows the breadcrumbs back from `end`; the start cell itself is not part of the path. */
function tracePath(cameFrom: Map<string, GridCell | null>, end: GridCell): GridCell[] {
  const path: GridCell[] = [];
  let cell = end;
  let parent = cameFrom.get(cellKey(cell));
  while (parent) {
    path.push(cell);
    cell = parent;
    parent = cameFrom.get(cellKey(cell));
  }
  return path.reverse();
}

/** Breadth-first search over open cells, 4 directions, to the nearest cell that `isGoal` accepts. */
function search(island: Island, from: GridCell, isGoal: (cell: GridCell) => boolean): GridCell[] | undefined {
  const isOpen = openCellCheck(island);
  const cameFrom = new Map<string, GridCell | null>([[cellKey(from), null]]);
  const queue = [from];
  for (const cell of queue) {
    if (isGoal(cell)) return tracePath(cameFrom, cell);
    for (const next of neighbours(cell).filter(isOpen)) {
      if (cameFrom.has(cellKey(next))) continue;
      cameFrom.set(cellKey(next), cell);
      queue.push(next);
    }
  }
  return undefined;
}

/** The shortest path from one cell to another, without `from`; undefined if `to` is blocked or unreachable. */
export function findPath(island: Island, from: GridCell, to: GridCell): GridCell[] | undefined {
  if (!openCellCheck(island)(to)) return undefined;
  return search(island, from, (cell) => isSameCell(cell, to));
}

/** True if the cell touches the plot's footprint up, down, left or right, without being part of it. */
export function isNextToPlot(cell: GridCell, plot: PlacedCrop): boolean {
  const footprint = plotCells(plot);
  const isInside = footprint.some((part) => isSameCell(part, cell));
  return !isInside && footprint.some((part) => neighbours(part).some((next) => isSameCell(next, cell)));
}

/** The walkable cell next to a plot the player can reach soonest; undefined if there is none. */
export function approachCell(state: GameState, plot: PlacedCrop, now: number): GridCell | undefined {
  const isOpen = openCellCheck(state);
  const from = walkOrigin(state.player, now);
  const path = search(state, from, (cell) => isOpen(cell) && isNextToPlot(cell, plot));
  return path && (path.at(-1) ?? from);
}

/** Steps walked at `now`, fractional mid-step, from 0 to the length of the path. */
function stepsAt(player: PlayerState, now: number): number {
  return Math.min(player.path.length, Math.max(0, (now - player.walkStartedAt) / STEP_MS));
}

function walkProgress(player: PlayerState, now: number): WalkProgress {
  const steps = stepsAt(player, now);
  const stepsDone = Math.floor(steps);
  return { stepsDone, isMidStep: steps > stepsDone };
}

/** The cell after `steps` steps: the start cell at 0, then each cell of the path. */
function cellAfter(player: PlayerState, steps: number): GridCell {
  return player.path[steps - 1] ?? { x: player.x, z: player.z };
}

/** The cell the player has last reached at `now`. Mid-step, that is still the cell it is leaving. */
export function playerCell(state: Pick<GameState, 'player'>, now: number): GridCell {
  return cellAfter(state.player, walkProgress(state.player, now).stepsDone);
}

/** Where the player is at `now`, in cell units, moving at an even pace between cell centres. */
export function playerPosition(state: Pick<GameState, 'player'>, now: number): GridCell {
  const { player } = state;
  const steps = stepsAt(player, now);
  const leaving = cellAfter(player, Math.floor(steps));
  const entering = cellAfter(player, Math.ceil(steps));
  const fraction = steps - Math.floor(steps);
  return { x: leaving.x + (entering.x - leaving.x) * fraction, z: leaving.z + (entering.z - leaving.z) * fraction };
}

export function isWalking(state: Pick<GameState, 'player'>, now: number): boolean {
  return walkProgress(state.player, now).stepsDone < state.player.path.length;
}

/** Where a new walk starts from: the cell the player is on, or the one it is stepping into. */
function walkOrigin(player: PlayerState, now: number): GridCell {
  const { stepsDone, isMidStep } = walkProgress(player, now);
  return cellAfter(player, isMidStep ? stepsDone + 1 : stepsDone);
}

/**
 * A walk to `to` from where the player is at `now`. Mid-step, the player finishes the step it is taking,
 * so the new walk keeps that step (and its start time) and continues from there. Undefined if unreachable.
 */
export function walkTo(state: GameState, to: GridCell, now: number): PlayerState | undefined {
  const { player } = state;
  const { stepsDone, isMidStep } = walkProgress(player, now);
  const path = findPath(state, walkOrigin(player, now), to);
  if (!path) return undefined;
  if (!isMidStep) return { ...playerCell(state, now), path, walkStartedAt: now };
  const leaving = cellAfter(player, stepsDone);
  const stepStartedAt = player.walkStartedAt + stepsDone * STEP_MS;
  return { ...leaving, path: [cellAfter(player, stepsDone + 1), ...path], walkStartedAt: stepStartedAt };
}

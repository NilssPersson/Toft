import { PLAYER_CLEARANCE } from './config.ts';
import { blockedCells, cellKey, isOnIsland, isSameCell, plotCells } from './grid.ts';
import type { GameState, GridCell, IslandPoint, PlacedCrop } from './types.ts';

/** Up, right, down, left: a fixed order, so the same grid always gives the same path. */
const NEIGHBOUR_OFFSETS: readonly GridCell[] = [
  { x: 0, z: -1 },
  { x: 1, z: 0 },
  { x: 0, z: 1 },
  { x: -1, z: 0 },
];

/** How far apart, in cells, a straight line is checked for anything in the way. */
const LINE_CHECK_STEP = 0.05;

/** The corners of the square the player needs free around a point. */
const CLEARANCE_OFFSETS: readonly IslandPoint[] = [
  { x: -PLAYER_CLEARANCE, z: -PLAYER_CLEARANCE },
  { x: PLAYER_CLEARANCE, z: -PLAYER_CLEARANCE },
  { x: -PLAYER_CLEARANCE, z: PLAYER_CLEARANCE },
  { x: PLAYER_CLEARANCE, z: PLAYER_CLEARANCE },
];

export type Island = Pick<GameState, 'islandSize' | 'crops' | 'decorations'>;

type CellCheck = (cell: GridCell) => boolean;

/** The cell a point lies in. */
export function cellOf(point: IslandPoint): GridCell {
  return { x: Math.round(point.x), z: Math.round(point.z) };
}

export function distanceBetween(from: IslandPoint, to: IslandPoint): number {
  return Math.hypot(to.x - from.x, to.z - from.z);
}

function neighbours(cell: GridCell): GridCell[] {
  return NEIGHBOUR_OFFSETS.map((offset) => ({ x: cell.x + offset.x, z: cell.z + offset.z }));
}

function openCellCheck(island: Island): CellCheck {
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
function search(island: Island, from: GridCell, isGoal: CellCheck): GridCell[] | undefined {
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

/** The fewest cells from one cell to another, without `from`; undefined if `to` is blocked or unreachable. */
export function findCellPath(island: Island, from: GridCell, to: GridCell): GridCell[] | undefined {
  if (!openCellCheck(island)(to)) return undefined;
  return search(island, from, (cell) => isSameCell(cell, to));
}

/** True if the cell touches the plot's footprint up, down, left or right, without being part of it. */
export function isNextToPlot(cell: GridCell, plot: PlacedCrop): boolean {
  const footprint = plotCells(plot);
  const isInside = footprint.some((part) => isSameCell(part, cell));
  return !isInside && footprint.some((part) => neighbours(part).some((next) => isSameCell(next, cell)));
}

/** The open cell next to a plot that is the fewest cells from `from`; undefined if none can be reached. */
export function nearestCellNextTo(island: Island, from: GridCell, plot: PlacedCrop): GridCell | undefined {
  const isOpen = openCellCheck(island);
  const path = search(island, from, (cell) => isOpen(cell) && isNextToPlot(cell, plot));
  return path && (path.at(-1) ?? from);
}

function hasRoomAt(isOpen: CellCheck, point: IslandPoint): boolean {
  return CLEARANCE_OFFSETS.every((offset) => isOpen(cellOf({ x: point.x + offset.x, z: point.z + offset.z })));
}

/** True if the player can walk straight from one point to the other, keeping its clearance the whole way. */
function isClearLine(isOpen: CellCheck, from: IslandPoint, to: IslandPoint): boolean {
  const checks = Math.ceil(distanceBetween(from, to) / LINE_CHECK_STEP);
  for (let i = 0; i <= checks; i++) {
    const along = checks === 0 ? 0 : i / checks;
    if (!hasRoomAt(isOpen, { x: from.x + (to.x - from.x) * along, z: from.z + (to.z - from.z) * along })) return false;
  }
  return true;
}

type SightCheck = (from: IslandPoint, to: IslandPoint) => boolean;

/** How many of the waypoints ahead to skip: the furthest one in a straight line from `anchor` is kept. */
function waypointsToSkip(canSee: SightCheck, anchor: IslandPoint, ahead: IslandPoint[]): number {
  for (let i = ahead.length - 1; i > 0; i--) {
    const waypoint = ahead[i];
    if (waypoint && canSee(anchor, waypoint)) return i;
  }
  return 0;
}

/** Cuts the corners of a cell-by-cell route: each leg goes straight to the furthest waypoint in sight. */
function straightenRoute(isOpen: CellCheck, from: IslandPoint, waypoints: IslandPoint[]): IslandPoint[] {
  const canSee: SightCheck = (start, end) => isClearLine(isOpen, start, end);
  const route: IslandPoint[] = [];
  let anchor = from;
  let next = 0;
  while (next < waypoints.length) {
    const reached = next + waypointsToSkip(canSee, anchor, waypoints.slice(next));
    anchor = waypoints[reached] ?? anchor;
    route.push(anchor);
    next = reached + 1;
  }
  return route;
}

/**
 * The route from one point to another, without `from`: straight lines at any angle, around crops and blocking decorations.
 * Empty when already there; undefined if the point is off the island, blocked or unreachable.
 */
export function findPath(island: Island, from: IslandPoint, to: IslandPoint): IslandPoint[] | undefined {
  const cells = findCellPath(island, cellOf(from), cellOf(to));
  if (!cells) return undefined;
  if (distanceBetween(from, to) === 0) return [];
  // Through the centre of each cell on the way, then to the exact point in the last one.
  const waypoints: IslandPoint[] = [...cells.slice(0, -1), to];
  return straightenRoute(openCellCheck(island), from, waypoints);
}

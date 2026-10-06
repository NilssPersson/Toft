// Build mode: an item from the shop sits on the island as a ghost the player moves, turns, then confirms or cancels.
// The draft is UI state; only confirming dispatches a game action ('place' for a crop, 'build' for a decoration).
import { applyAction, canPlace, freeCellNear, isOnIsland, playerCell } from '../game/index.ts';
import type { Action, Footprint, GameState, GridCell, Placement, Rotation } from '../game/index.ts';
import { now } from './clock.ts';
import { shopItem, itemFootprint } from './shopItems.ts';
import { useStore } from './store.ts';
import type { BuildDraft } from './store.ts';
import { screenStep, viewFacing } from './view.ts';
import type { ScreenDirection } from './view.ts';

/** Right, down, left, up seen from above: the order a confirmed item looks for the next free cell, from its rotation. */
const NEIGHBOUR_DIRECTIONS: readonly GridCell[] = [
  { x: 1, z: 0 },
  { x: 0, z: 1 },
  { x: -1, z: 0 },
  { x: 0, z: -1 },
];

export type BuildStatus = 'off' | 'valid' | 'invalid';

/** The action confirming the draft would dispatch. */
export function draftAction(draft: BuildDraft): Action {
  const { x, z } = draft.cell;
  if (draft.kind === 'crop') return { type: 'place', cropId: draft.itemId, x, z };
  return { type: 'build', decorationId: draft.itemId, x, z, rotation: draft.rotation };
}

function draftFootprint(draft: BuildDraft): Footprint {
  const item = shopItem(draft.itemId);
  return item ? itemFootprint(item, draft.rotation) : { w: 1, d: 1 };
}

export function draftPlacement(draft: BuildDraft): Placement {
  return { ...draft.cell, footprint: draftFootprint(draft) };
}

/** Valid exactly when the rules would accept the action: the same checks, so the ghost never disagrees with them. */
export function buildStatus(game: GameState, draft: BuildDraft | null, at: number): BuildStatus {
  if (!draft) return 'off';
  return applyAction(game, draftAction(draft), at) === game ? 'invalid' : 'valid';
}

function islandCentre(game: GameState): GridCell {
  const middle = Math.floor(game.islandSize / 2);
  return { x: middle, z: middle };
}

/** The free cell nearest the one in front of the player (toward the camera), or the island's centre. */
function startCell(game: GameState, footprint: Footprint): GridCell {
  const at = now();
  const player = playerCell(game, at);
  const facing = viewFacing();
  const target = { x: player.x + facing.x, z: player.z + facing.z };
  return freeCellNear(game, { target, footprint }, at) ?? islandCentre(game);
}

/** Starts build mode with an unlocked shop item, closing the open panel. A locked or unknown item does nothing. */
export function startBuild(itemId: string): void {
  const { game, closePanel, setBuildDraft } = useStore.getState();
  const item = shopItem(itemId);
  if (!item || item.unlockLevel > game.progression.level) return;
  const cell = startCell(game, itemFootprint(item, 0));
  setBuildDraft({ kind: item.kind, itemId, cell, rotation: 0 });
  closePanel();
}

function updateDraft(change: (draft: BuildDraft) => Partial<BuildDraft>): void {
  const { buildDraft, setBuildDraft } = useStore.getState();
  if (buildDraft) setBuildDraft({ ...buildDraft, ...change(buildDraft) });
}

/** Moves the ghost to a cell on the island; a cell off it is ignored. */
export function moveGhost(cell: GridCell): void {
  const { islandSize } = useStore.getState().game;
  if (isOnIsland(cell, islandSize)) updateDraft(() => ({ cell }));
}

/** Moves the ghost one cell the given way on screen. */
export function nudgeGhost(direction: ScreenDirection): void {
  const draft = useStore.getState().buildDraft;
  const step = screenStep(direction);
  if (draft) moveGhost({ x: draft.cell.x + step.x, z: draft.cell.z + step.z });
}

export function canRotate(draft: BuildDraft): boolean {
  return shopItem(draft.itemId)?.isRotatable === true;
}

/** A quarter turn clockwise, for items that can turn. */
export function rotateGhost(): void {
  const draft = useStore.getState().buildDraft;
  if (draft && canRotate(draft)) updateDraft(() => ({ rotation: ((draft.rotation + 90) % 360) as Rotation }));
}

/** The four directions, starting with the one the rotation faces. */
function directionsFrom(rotation: Rotation): GridCell[] {
  const first = rotation / 90;
  return [...NEIGHBOUR_DIRECTIONS.slice(first), ...NEIGHBOUR_DIRECTIONS.slice(0, first)];
}

/** The free cell beside the draft, one footprint away, trying the way it faces first; else any free cell near it. */
function nextFreeCell(game: GameState, draft: BuildDraft): GridCell {
  const at = now();
  const footprint = draftFootprint(draft);
  const neighbours = directionsFrom(draft.rotation).map((step) => ({
    x: draft.cell.x + step.x * footprint.w,
    z: draft.cell.z + step.z * footprint.d,
  }));
  const beside = neighbours.find((cell) => canPlace(game, { ...cell, footprint }, at));
  return beside ?? freeCellNear(game, { target: draft.cell, footprint }, at) ?? draft.cell;
}

/** Builds or plants the draft if the spot is valid, then moves the ghost on so the next one is quick to lay. */
export function confirmBuild(): void {
  const { buildDraft, dispatch } = useStore.getState();
  if (!buildDraft) return;
  const before = useStore.getState().game;
  dispatch(draftAction(buildDraft));
  const after = useStore.getState().game;
  if (after !== before) updateDraft((draft) => ({ cell: nextFreeCell(after, draft) }));
}

export function cancelBuild(): void {
  useStore.getState().setBuildDraft(null);
}

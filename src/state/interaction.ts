// What a click on the island does: walk somewhere, or walk to a crop and tend it; in build mode, move the ghost.
// The scene calls these on clicks and every frame; the test hook calls them in place of clicks.
import { approachCell, cellOf, isNextToPlot, isReady, playerCell } from '../game/index.ts';
import type { Action, IslandPoint, PlacedCrop } from '../game/index.ts';
import { moveGhost } from './build.ts';
import { now } from './clock.ts';
import { useStore } from './store.ts';

function isBuilding(): boolean {
  return useStore.getState().buildDraft !== null;
}

/** What tending a plot does: water it while it waits, harvest it once ready. */
function plotAction(plot: PlacedCrop, at: number): Action | null {
  if (plot.status === 'needsRequirement') return { type: 'fulfil', uid: plot.uid };
  if (isReady(plot, at)) return { type: 'harvest', uid: plot.uid };
  return null;
}

/** Walks to a point, dropping any crop the player was on its way to. */
export function walkToPoint({ x, z }: IslandPoint): void {
  const { dispatch, setPendingCrop } = useStore.getState();
  setPendingCrop(null);
  dispatch({ type: 'move', x, z });
}

/** Walks next to a crop and tends it on arrival. A crop with no reachable cell next to it does nothing. */
export function walkToCrop(uid: string): void {
  const { game, dispatch, setPendingCrop } = useStore.getState();
  const plot = game.crops.find((crop) => crop.uid === uid);
  const cell = plot && approachCell(game, plot, now());
  if (!cell) return;
  setPendingCrop(uid);
  dispatch({ type: 'move', ...cell });
}

/** Called every frame: once the player stands next to the crop it walked to, waters or harvests it. */
export function tendPendingCrop(): void {
  const { game, pendingCropUid, dispatch, setPendingCrop } = useStore.getState();
  if (pendingCropUid === null) return;
  const at = now();
  const plot = game.crops.find((crop) => crop.uid === pendingCropUid);
  if (plot && !isNextToPlot(playerCell(game, at), plot)) return;
  setPendingCrop(null);
  const action = plot && plotAction(plot, at);
  if (action) dispatch(action);
}

/** A tap on open ground: in build mode the ghost moves to that cell and the player stays put; otherwise it walks there. */
export function tapGround(point: IslandPoint): void {
  if (isBuilding()) moveGhost(cellOf(point));
  else walkToPoint(point);
}

/** A tap on a crop: in build mode the ghost moves to that cell; otherwise the player walks over to tend it. */
export function tapCrop(uid: string, point: IslandPoint): void {
  if (isBuilding()) moveGhost(cellOf(point));
  else walkToCrop(uid);
}

/** A tap on a decoration only does anything in build mode, where the ghost moves to that cell. */
export function tapDecoration(point: IslandPoint): void {
  if (isBuilding()) moveGhost(cellOf(point));
}

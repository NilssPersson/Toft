// What a click on the island does, apart from planting: walk somewhere, or walk to a crop and tend it.
// The scene calls these on clicks and every frame; the test hook calls them in place of clicks.
import { approachCell, isNextToPlot, isReady, playerCell } from '../game/index.ts';
import type { Action, IslandPoint, PlacedCrop } from '../game/index.ts';
import { now } from './clock.ts';
import { useStore } from './store.ts';

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

// Which way the camera looks at the island, so "in front of the player" and the arrow keys follow the view.
// FollowCamera updates it every frame; it is view state, never game state.
import type { GridCell } from '../game/index.ts';

/** One grid step from the player toward the camera. Starts toward +z, the side the camera starts on. */
let towardCamera: GridCell = { x: 0, z: 1 };

export function viewFacing(): GridCell {
  return towardCamera;
}

/** Rounds the camera's offset from the player to the nearest of the four grid directions. */
export function setViewFacing(offsetX: number, offsetZ: number): void {
  towardCamera =
    Math.abs(offsetX) > Math.abs(offsetZ) ? { x: Math.sign(offsetX), z: 0 } : { x: 0, z: Math.sign(offsetZ) || 1 };
}

export type ScreenDirection = 'up' | 'down' | 'left' | 'right';

/** One grid step that moves something the given way on screen: down is toward the camera. */
export function screenStep(direction: ScreenDirection): GridCell {
  const { x, z } = towardCamera;
  const steps: Record<ScreenDirection, GridCell> = {
    down: { x, z },
    up: { x: -x, z: -z },
    right: { x: z, z: -x },
    left: { x: -z, z: x },
  };
  return steps[direction];
}

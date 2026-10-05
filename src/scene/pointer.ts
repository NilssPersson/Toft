import type { ThreeEvent } from '@react-three/fiber';

/** How far, in pixels, the pointer may move between press and release and still count as a tap. */
const TAP_SLOP_PX = 6;

/** True if the pointer moved too far to be a tap: the player was turning the camera, so the click does nothing. */
export function wasDrag(event: ThreeEvent<MouseEvent>): boolean {
  return event.delta > TAP_SLOP_PX;
}

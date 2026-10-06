import { useRef } from 'react';
import type { ComponentRef, ReactElement, RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { playerPosition } from '../game/index.ts';
import { now } from '../state/clock.ts';
import { useStore } from '../state/store.ts';
import { setViewFacing } from '../state/view.ts';
import { cellCenter } from './coords.ts';

/** Angle down from straight overhead. Locked, so the camera only turns around the player, never tilts. */
const CAMERA_TILT = 0.9;
const MIN_DISTANCE = 7;
const MAX_DISTANCE = 22;
/** Look at the player's middle, not its feet. */
const FOCUS_HEIGHT = 0.5;

type Orbit = ComponentRef<typeof OrbitControls>;

// Reused every frame rather than allocated.
const focus = new Vector3();
const shift = new Vector3();

/** Moves the camera and its target by the same amount, so the angle and zoom the player chose are kept. */
function moveFocus(orbit: Orbit, target: Vector3): void {
  shift.subVectors(target, orbit.target);
  if (shift.lengthSq() === 0) return;
  orbit.object.position.add(shift);
  orbit.target.add(shift);
  orbit.update();
}

/** Tells build mode which way the camera looks, so "in front of the player" and the arrow keys follow the view. */
function reportFacing(orbit: Orbit): void {
  setViewFacing(orbit.object.position.x - orbit.target.x, orbit.object.position.z - orbit.target.z);
}

/** Every frame, keeps the player at the centre of the view. */
function useFollowPlayer(): RefObject<Orbit | null> {
  const controls = useRef<Orbit>(null);
  useFrame(() => {
    const { game } = useStore.getState();
    const [x, , z] = cellCenter(playerPosition(game, now()), game.islandSize);
    if (!controls.current) return;
    moveFocus(controls.current, focus.set(x, FOCUS_HEIGHT, z));
    reportFacing(controls.current);
  });
  return controls;
}

/**
 * Follows the player. Dragging turns the camera around it at a fixed tilt; pinching or scrolling zooms.
 * The default controls, so the build ghost can switch them off while it is dragged.
 */
export function FollowCamera(): ReactElement {
  const controls = useFollowPlayer();
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      minPolarAngle={CAMERA_TILT}
      maxPolarAngle={CAMERA_TILT}
    />
  );
}

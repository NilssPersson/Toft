import { useRef } from 'react';
import type { ComponentRef, ReactElement, RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { playerPosition } from '../game/index.ts';
import { now } from '../state/clock.ts';
import { useStore } from '../state/store.ts';
import { cellCenter } from './coords.ts';

/** Angle down from straight overhead. Locked, so the camera only turns around the player, never tilts. */
const CAMERA_TILT = 0.9;
const MIN_DISTANCE = 7;
const MAX_DISTANCE = 18;
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

/** Every frame, keeps the player at the centre of the view. */
function useFollowPlayer(): RefObject<Orbit | null> {
  const controls = useRef<Orbit>(null);
  useFrame(() => {
    const { game } = useStore.getState();
    const [x, , z] = cellCenter(playerPosition(game, now()), game.islandSize);
    if (controls.current) moveFocus(controls.current, focus.set(x, FOCUS_HEIGHT, z));
  });
  return controls;
}

/** Follows the player. Dragging turns the camera around it at a fixed tilt; pinching or scrolling zooms. */
export function FollowCamera(): ReactElement {
  const controls = useFollowPlayer();
  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      minPolarAngle={CAMERA_TILT}
      maxPolarAngle={CAMERA_TILT}
    />
  );
}

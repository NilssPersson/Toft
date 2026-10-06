import { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Plane, Vector3 } from 'three';
import { moveGhost } from '../../state/build.ts';
import { worldToCell } from '../coords.ts';

const GROUND = new Plane(new Vector3(0, 1, 0), 0);
// Reused on every pointer move rather than allocated.
const hit = new Vector3();

type PointerHandler = (event: ThreeEvent<PointerEvent>) => void;

export interface GhostDragHandlers {
  onPointerDown: PointerHandler;
  onPointerMove: PointerHandler;
  onPointerUp: PointerHandler;
  onPointerCancel: PointerHandler;
  onLostPointerCapture: PointerHandler;
}

/** Anything with an on/off switch, such as the camera controls. */
interface Switchable {
  enabled: boolean;
}

function isSwitchable(controls: unknown): controls is Switchable {
  return typeof controls === 'object' && controls !== null && 'enabled' in controls;
}

/**
 * Dragging the ghost: it snaps to the cell under the pointer as it moves over the ground. The camera controls are
 * off for the whole drag, so the view neither turns nor pans; a drag that starts anywhere else still moves the camera.
 */
export function useGhostDrag(islandSize: number): GhostDragHandlers {
  const getState = useThree((state) => state.get);
  const isDragging = useRef(false);
  const setCameraEnabled = (isEnabled: boolean): void => {
    const { controls } = getState();
    if (isSwitchable(controls)) controls.enabled = isEnabled;
  };
  const endDrag: PointerHandler = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setCameraEnabled(true);
  };
  const onPointerDown: PointerHandler = (event) => {
    event.stopPropagation();
    (event.target as Element).setPointerCapture(event.pointerId);
    isDragging.current = true;
    setCameraEnabled(false);
  };
  const onPointerMove: PointerHandler = (event) => {
    if (!isDragging.current || !event.ray.intersectPlane(GROUND, hit)) return;
    const [x, z] = worldToCell(hit.x, hit.z, islandSize);
    moveGhost({ x, z });
  };
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onLostPointerCapture: endDrag,
  };
}

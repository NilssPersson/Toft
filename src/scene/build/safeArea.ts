import type { Camera, Object3D } from 'three';
import { Vector3 } from 'three';

/** Half the size of the build controls, in pixels, plus a little room, so all three buttons stay on screen. */
const HALF_WIDTH = 96;
const HALF_HEIGHT = 32;

interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Reused every frame rather than allocated.
const projected = new Vector3();

/** The screen's safe area: the HUD's box, which CSS keeps clear of the notch and home indicator. */
function safeBounds(size: { width: number; height: number }): Bounds {
  const hud = document.querySelector('.hud')?.getBoundingClientRect();
  return hud ?? { left: 0, top: 0, right: size.width, bottom: size.height };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Where drei's Html puts the build controls: over the anchor, as usual, but moved back inside the safe area
 * when the ghost is near the edge of the screen. The controls are centred on this point.
 */
export function positionInSafeArea(
  anchor: Object3D,
  camera: Camera,
  size: { width: number; height: number },
): number[] {
  projected.setFromMatrixPosition(anchor.matrixWorld).project(camera);
  const x = ((projected.x + 1) / 2) * size.width;
  const y = ((1 - projected.y) / 2) * size.height;
  const bounds = safeBounds(size);
  return [
    clamp(x, bounds.left + HALF_WIDTH, bounds.right - HALF_WIDTH),
    clamp(y, bounds.top + HALF_HEIGHT, bounds.bottom - HALF_HEIGHT),
  ];
}

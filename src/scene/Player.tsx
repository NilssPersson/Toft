import { useRef } from 'react';
import type { ReactElement, RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { isWalking, playerPosition } from '../game/index.ts';
import { now } from '../state/clock.ts';
import { tendPendingCrop } from '../state/interaction.ts';
import { useStore } from '../state/store.ts';
import { prefersReducedMotion } from '../ui/motion.ts';
import { cellCenter } from './coords.ts';

const PLAYER_COLOR = '#3d6fb6';
const PLAYER_RADIUS = 0.25;
const PLAYER_BODY_LENGTH = 0.5;
const PLAYER_STANDING_Y = PLAYER_RADIUS + PLAYER_BODY_LENGTH / 2;
const BOB_HEIGHT = 0.06;
const BOB_SPEED = 14;

/** A little hop while walking; none with reduced motion, where the walk is only the path over time. */
function bobOffset(isMoving: boolean, elapsed: number): number {
  if (!isMoving || prefersReducedMotion()) return 0;
  return Math.abs(Math.sin(elapsed * BOB_SPEED)) * BOB_HEIGHT;
}

/** Moves the player along its path every frame through a ref, and tends the crop it walked to on arrival. */
function usePlayerAnimation(): RefObject<Group | null> {
  const body = useRef<Group>(null);
  useFrame(({ clock }) => {
    const { game } = useStore.getState();
    const at = now();
    const [x, , z] = cellCenter(playerPosition(game, at), game.islandSize);
    body.current?.position.set(x, PLAYER_STANDING_Y + bobOffset(isWalking(game, at), clock.elapsedTime), z);
    tendPendingCrop();
  });
  return body;
}

/** Placeholder until a real model exists: a capsule standing on its cell. */
export function Player(): ReactElement {
  const body = usePlayerAnimation();
  return (
    <group ref={body}>
      <mesh castShadow>
        <capsuleGeometry args={[PLAYER_RADIUS, PLAYER_BODY_LENGTH, 6, 12]} />
        <meshStandardMaterial color={PLAYER_COLOR} />
      </mesh>
    </group>
  );
}

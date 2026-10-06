import type { ReactElement } from 'react';
import { FollowCamera } from './FollowCamera.tsx';
import { Island } from './Island.tsx';
import { Ocean } from './ocean/Ocean.tsx';

/** Half the width the sun's shadows cover: the whole island and a little past it. */
const SHADOW_REACH = 12;

export function GameScene(): ReactElement {
  return (
    <>
      <color attach="background" args={['#bfe3f2']} />
      <hemisphereLight args={['#fff7e8', '#6c8f5a', 0.9]} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-SHADOW_REACH}
        shadow-camera-right={SHADOW_REACH}
        shadow-camera-top={SHADOW_REACH}
        shadow-camera-bottom={-SHADOW_REACH}
      />

      <Ocean />

      <Island />

      <FollowCamera />
    </>
  );
}

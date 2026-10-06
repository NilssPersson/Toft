import type { ReactElement } from 'react';
import { FollowCamera } from './FollowCamera.tsx';
import { Island } from './Island.tsx';

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
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Sea */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#5fb2cf" />
      </mesh>

      <Island />

      <FollowCamera />
    </>
  );
}

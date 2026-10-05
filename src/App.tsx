import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './scene/GameScene.tsx';
import { lockLandscapeInFullscreen } from './pwa/orientation.ts';
import { registerServiceWorker } from './pwa/serviceWorker.ts';
import { Hud } from './ui/Hud.tsx';
import { RotateScreen } from './ui/RotateScreen.tsx';

export function App(): ReactElement {
  useEffect(registerServiceWorker, []);
  useEffect(lockLandscapeInFullscreen, []);
  return (
    <>
      <Canvas shadows camera={{ position: [11, 12, 11], fov: 40 }} dpr={[1, 2]}>
        <GameScene />
      </Canvas>
      <Hud />
      <RotateScreen />
    </>
  );
}

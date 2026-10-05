import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './scene/GameScene.tsx';
import { PlayerStateSignal } from './scene/PlayerStateSignal.tsx';
import type { PlayerActivity } from './scene/PlayerStateSignal.tsx';
import { ReadySignal } from './scene/ReadySignal.tsx';
import { lockLandscapeInFullscreen } from './pwa/orientation.ts';
import { registerServiceWorker } from './pwa/serviceWorker.ts';
import { Hud } from './ui/Hud.tsx';
import { RotateScreen } from './ui/RotateScreen.tsx';

/** Test builds only: the flag is replaced at build time, so production bundles drop the import entirely. */
function installTestHookInTestBuilds(): void {
  if (import.meta.env.PUBLIC_TEST_HOOKS !== 'true') return;
  void import('./testing/testHook.ts').then(({ installTestHook }) => {
    installTestHook();
  });
}

export function App(): ReactElement {
  const root = useRef<HTMLDivElement>(null);
  // Set once on the DOM node, never through React state: tests wait for data-ready="true".
  const markReady = (): void => root.current?.setAttribute('data-ready', 'true');
  const markPlayer = (activity: PlayerActivity): void => root.current?.setAttribute('data-player-state', activity);
  useEffect(registerServiceWorker, []);
  useEffect(lockLandscapeInFullscreen, []);
  useEffect(installTestHookInTestBuilds, []);
  return (
    <div className="game" data-testid="game" data-ready="false" data-player-state="idle" ref={root}>
      <Canvas shadows camera={{ position: [11, 12, 11], fov: 40 }} dpr={[1, 2]}>
        <GameScene />
        <ReadySignal onFirstFrame={markReady} />
        <PlayerStateSignal onChange={markPlayer} />
      </Canvas>
      <Hud />
      <RotateScreen />
    </div>
  );
}

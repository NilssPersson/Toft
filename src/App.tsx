import { Canvas } from '@react-three/fiber';
import { GameScene } from './scene/GameScene.tsx';
import { Hud } from './ui/Hud.tsx';

export function App() {
  return (
    <>
      <Canvas shadows camera={{ position: [11, 12, 11], fov: 40 }} dpr={[1, 2]}>
        <GameScene />
      </Canvas>
      <Hud />
    </>
  );
}

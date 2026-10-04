import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import { getCrop, growthProgress, isReady } from '../game/index.ts';
import type { PlacedCrop } from '../game/index.ts';
import { useStore } from '../state/store.ts';
import { footprintCenter } from './coords.ts';

/**
 * Placeholder visuals: a soil bed plus a cone that grows with progress.
 * Growth is animated per frame through refs, never through React state,
 * so ticking time never re-renders the tree.
 */
export function CropPlot({ plot, islandSize }: { plot: PlacedCrop; islandSize: number }) {
  const crop = getCrop(plot.cropId);
  const dispatch = useStore((s) => s.dispatch);
  const plant = useRef<Group>(null);
  const marker = useRef<Mesh>(null);
  const [x, , z] = footprintCenter(plot.x, plot.z, crop.footprint, islandSize);

  useFrame(({ clock }) => {
    const now = Date.now();
    const p = growthProgress(plot, now);
    const ready = isReady(plot, now);
    if (plant.current) {
      const s = plot.status === 'needsRequirement' ? 0.25 : 0.25 + 0.75 * p;
      plant.current.scale.setScalar(s);
      plant.current.position.y = ready ? Math.sin(clock.elapsedTime * 3) * 0.05 : 0;
    }
    if (marker.current) {
      marker.current.visible = plot.status === 'needsRequirement' || ready;
      marker.current.position.y = 1.1 + Math.sin(clock.elapsedTime * 2) * 0.08;
      (marker.current.material as MeshStandardMaterial).color.set(ready ? '#ffd84a' : '#4aa8e8');
    }
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (plot.status === 'needsRequirement') dispatch({ type: 'fulfil', uid: plot.uid });
    else if (isReady(plot, Date.now())) dispatch({ type: 'harvest', uid: plot.uid });
  };

  return (
    <group position={[x, 0, z]} onClick={onClick}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[crop.footprint.w * 0.9, 0.1, crop.footprint.d * 0.9]} />
        <meshStandardMaterial color="#6b4a2f" />
      </mesh>
      <group ref={plant}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <coneGeometry args={[0.32 * Math.min(crop.footprint.w, crop.footprint.d) + 0.05, 0.8, 7]} />
          <meshStandardMaterial color={crop.color} flatShading />
        </mesh>
      </group>
      {/* Floating marker: blue = needs water, yellow = ready to harvest */}
      <mesh ref={marker}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#4aa8e8" emissive="#222" />
      </mesh>
    </group>
  );
}

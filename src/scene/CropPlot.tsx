import { useRef } from 'react';
import type { ReactElement, RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import { getCrop, growthProgress, isReady } from '../game/index.ts';
import type { PlacedCrop } from '../game/index.ts';
import { now } from '../state/clock.ts';
import { tapCrop } from '../state/interaction.ts';
import { wasDrag } from './pointer.ts';
import { footprintCenter, worldToIsland } from './coords.ts';
import { PlantCone, SoilBed } from './models/CropModel.tsx';

const SEEDLING_SCALE = 0.25;
const NEEDS_WATER_COLOR = '#4aa8e8';
const READY_COLOR = '#ffd84a';

interface CropPlotProps {
  plot: PlacedCrop;
  islandSize: number;
}

interface Frame {
  now: number;
  elapsed: number;
}

function animatePlant(plant: Group, plot: PlacedCrop, frame: Frame): void {
  const isWaiting = plot.status === 'needsRequirement';
  const scale = isWaiting ? SEEDLING_SCALE : SEEDLING_SCALE + (1 - SEEDLING_SCALE) * growthProgress(plot, frame.now);
  plant.scale.setScalar(scale);
  plant.position.y = isReady(plot, frame.now) ? Math.sin(frame.elapsed * 3) * 0.05 : 0;
}

function animateMarker(marker: Mesh, plot: PlacedCrop, frame: Frame): void {
  const isPlotReady = isReady(plot, frame.now);
  marker.visible = plot.status === 'needsRequirement' || isPlotReady;
  marker.position.y = 1.1 + Math.sin(frame.elapsed * 2) * 0.08;
  (marker.material as MeshStandardMaterial).color.set(isPlotReady ? READY_COLOR : NEEDS_WATER_COLOR);
}

/** Growth is animated per frame through refs, never through React state, so ticking time never re-renders the tree. */
function usePlotAnimation(plot: PlacedCrop): { plant: RefObject<Group | null>; marker: RefObject<Mesh | null> } {
  const plant = useRef<Group>(null);
  const marker = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const frame = { now: now(), elapsed: clock.elapsedTime };
    if (plant.current) animatePlant(plant.current, plot, frame);
    if (marker.current) animateMarker(marker.current, plot, frame);
  });
  return { plant, marker };
}

/** Placeholder visuals: a soil bed plus a cone that grows with progress. Clicking walks the player over to water or harvest it,
 * or in build mode moves the ghost there. */
export function CropPlot({ plot, islandSize }: CropPlotProps): ReactElement {
  const crop = getCrop(plot.cropId);
  const { plant, marker } = usePlotAnimation(plot);
  const [x, , z] = footprintCenter({ x: plot.x, z: plot.z, footprint: crop.footprint }, islandSize);

  const onClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    if (!wasDrag(event)) tapCrop(plot.uid, worldToIsland(event.point.x, event.point.z, islandSize));
  };

  return (
    <group position={[x, 0, z]} onClick={onClick}>
      <SoilBed crop={crop} look="solid" />
      <group ref={plant}>
        <PlantCone crop={crop} look="solid" />
      </group>
      {/* Floating marker: blue = needs water, yellow = ready to harvest */}
      <mesh ref={marker}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={NEEDS_WATER_COLOR} emissive="#222" />
      </mesh>
    </group>
  );
}

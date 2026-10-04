import { useRef } from 'react';
import type { ReactElement, RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import { getCrop, growthProgress, isReady } from '../game/index.ts';
import type { Action, CropDef, PlacedCrop } from '../game/index.ts';
import { useStore } from '../state/store.ts';
import { footprintCenter } from './coords.ts';

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
    const frame = { now: Date.now(), elapsed: clock.elapsedTime };
    if (plant.current) animatePlant(plant.current, plot, frame);
    if (marker.current) animateMarker(marker.current, plot, frame);
  });
  return { plant, marker };
}

/** What clicking a plot does: water it while it waits, harvest it once ready. */
function plotAction(plot: PlacedCrop, now: number): Action | null {
  if (plot.status === 'needsRequirement') return { type: 'fulfil', uid: plot.uid };
  if (isReady(plot, now)) return { type: 'harvest', uid: plot.uid };
  return null;
}

function SoilBed({ crop }: { crop: CropDef }): ReactElement {
  return (
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <boxGeometry args={[crop.footprint.w * 0.9, 0.1, crop.footprint.d * 0.9]} />
      <meshStandardMaterial color="#6b4a2f" />
    </mesh>
  );
}

function PlantCone({ crop }: { crop: CropDef }): ReactElement {
  const radius = 0.32 * Math.min(crop.footprint.w, crop.footprint.d) + 0.05;
  return (
    <mesh position={[0, 0.45, 0]} castShadow>
      <coneGeometry args={[radius, 0.8, 7]} />
      <meshStandardMaterial color={crop.color} flatShading />
    </mesh>
  );
}

/** Placeholder visuals: a soil bed plus a cone that grows with progress. */
export function CropPlot({ plot, islandSize }: CropPlotProps): ReactElement {
  const crop = getCrop(plot.cropId);
  const dispatch = useStore((state) => state.dispatch);
  const { plant, marker } = usePlotAnimation(plot);
  const [x, , z] = footprintCenter({ x: plot.x, z: plot.z, footprint: crop.footprint }, islandSize);

  const onClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    const action = plotAction(plot, Date.now());
    if (action) dispatch(action);
  };

  return (
    <group position={[x, 0, z]} onClick={onClick}>
      <SoilBed crop={crop} />
      <group ref={plant}>
        <PlantCone crop={crop} />
      </group>
      {/* Floating marker: blue = needs water, yellow = ready to harvest */}
      <mesh ref={marker}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={NEEDS_WATER_COLOR} emissive="#222" />
      </mesh>
    </group>
  );
}

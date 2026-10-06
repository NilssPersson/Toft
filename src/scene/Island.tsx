import type { ReactElement } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { cellOf, isOnIsland } from '../game/index.ts';
import { tapGround } from '../state/interaction.ts';
import { useStore } from '../state/store.ts';
import { BuildGhost } from './build/BuildGhost.tsx';
import { CropPlot } from './CropPlot.tsx';
import { Decorations } from './Decorations.tsx';
import { Player } from './Player.tsx';
import { wasDrag } from './pointer.ts';
import { worldToIsland } from './coords.ts';
import { GRASS } from './grass/config.ts';
import { GrassTufts } from './grass/GrassTufts.tsx';
import { lawnWidth } from './grass/patches.ts';
import { useGrassSurface } from './grass/useGrassSurface.ts';

const SURFACE_Y = 0;
const BODY_HEIGHT = 0.8;
const SOIL_COLOR = '#c9a86a';
/** The turf lip sits a hair below the lawn so the two never fight over the same pixels. */
const LIP_DROP = 0.004;
/** A four-sided open tube turned by 45° is a box with no top or bottom: only the lawn fills the top of the island. */
const SIDES = 4;
const EIGHTH_TURN = Math.PI / 4;
const GRID_COLOR = '#4f7f36';
const GRID_OPACITY = 0.3;

/** The four sides of a square block, without its top and bottom, which nobody sees. */
function SidesGeometry({ width, height }: { width: number; height: number }): ReactElement {
  const radius = width / Math.SQRT2;
  return <cylinderGeometry args={[radius, radius, height, SIDES, 1, true, EIGHTH_TURN]} />;
}

/** The soil under the turf, its top tucked inside the turf lip. */
function IslandBody({ size }: { size: number }): ReactElement {
  const { overhang, thickness } = GRASS.lip;
  const width = lawnWidth(size) - overhang * 2;
  return (
    <mesh position={[0, SURFACE_Y - thickness / 2 - BODY_HEIGHT / 2, 0]} receiveShadow castShadow>
      <SidesGeometry width={width} height={BODY_HEIGHT} />
      <meshStandardMaterial color={SOIL_COLOR} flatShading />
    </mesh>
  );
}

/** A thin slab of turf on top of the body, overhanging it a little, so the edge reads as grass over soil. */
function TurfLip({ size }: { size: number }): ReactElement {
  const { thickness, color } = GRASS.lip;
  const width = lawnWidth(size);
  return (
    <mesh position={[0, SURFACE_Y - LIP_DROP - thickness / 2, 0]} receiveShadow castShadow>
      <SidesGeometry width={width} height={thickness} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

/** The cell grid, shown faintly only in build mode, so building lines up. */
function PlacementGrid({ size }: { size: number }): ReactElement | null {
  const isBuilding = useStore((state) => state.buildDraft !== null);
  if (!isBuilding) return null;
  return (
    <gridHelper
      args={[size, size, GRID_COLOR, GRID_COLOR]}
      position={[0, SURFACE_Y + 0.01, 0]}
      material-transparent
      material-opacity={GRID_OPACITY}
      material-depthWrite={false}
    />
  );
}

/**
 * The grass top: a tap walks the player there, or in build mode moves the ghost there.
 * Drags turn the camera and do neither; taps on the verge do nothing.
 */
function IslandGround({ size }: { size: number }): ReactElement {
  const { geometry, map } = useGrassSurface(size);
  const onClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    const point = worldToIsland(event.point.x, event.point.z, size);
    if (wasDrag(event) || !isOnIsland(cellOf(point), size)) return;
    tapGround(point);
  };
  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, SURFACE_Y + 0.001, 0]}
      receiveShadow
      onClick={onClick}
    >
      <meshStandardMaterial map={map} vertexColors />
    </mesh>
  );
}

export function Island(): ReactElement {
  const size = useStore((state) => state.game.islandSize);
  const crops = useStore((state) => state.game.crops);

  return (
    <group>
      <IslandBody size={size} />
      <TurfLip size={size} />
      <IslandGround size={size} />
      <PlacementGrid size={size} />
      <GrassTufts />
      {crops.map((plot) => (
        <CropPlot key={plot.uid} plot={plot} islandSize={size} />
      ))}
      <Decorations />
      <Player />
      <BuildGhost />
    </group>
  );
}

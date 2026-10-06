import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { canPlace, cellOf, getCrop, isOnIsland } from '../game/index.ts';
import type { IslandPoint, Placement } from '../game/index.ts';
import { now } from '../state/clock.ts';
import { walkToPoint } from '../state/interaction.ts';
import { useStore } from '../state/store.ts';
import { CropPlot } from './CropPlot.tsx';
import { Player } from './Player.tsx';
import { Walls } from './Walls.tsx';
import { wasDrag } from './pointer.ts';
import { footprintCenter, worldToCell, worldToIsland } from './coords.ts';
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

type Cell = [number, number];

interface PlacementHover {
  hover: Cell | null;
  onMove: (event: ThreeEvent<PointerEvent>) => void;
  onLeave: () => void;
}

function isSameHover(first: Cell | null, second: Cell | null): boolean {
  return first?.[0] === second?.[0] && first?.[1] === second?.[1];
}

/** Tracks which grid cell the pointer is over, updating state only when the cell changes. The verge has none. */
function usePlacementHover(size: number): PlacementHover {
  const [hover, setHover] = useState<Cell | null>(null);
  const onMove = (event: ThreeEvent<PointerEvent>): void => {
    const [x, z] = worldToCell(event.point.x, event.point.z, size);
    const cell: Cell | null = isOnIsland({ x, z }, size) ? [x, z] : null;
    if (!isSameHover(hover, cell)) setHover(cell);
  };
  return { hover, onMove, onLeave: () => setHover(null) };
}

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

/** The cell grid, shown faintly only while a crop is picked, so planting still lines up. */
function PlacementGrid({ size }: { size: number }): ReactElement | null {
  const isPlacing = useStore((state) => state.selectedCrop !== null);
  if (!isPlacing) return null;
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

interface IslandGroundProps {
  size: number;
  onGroundClick: (point: IslandPoint) => void;
}

/** The grass top: the click target for planting and walking, and the hover target for placement. Clicks on the verge do nothing. */
function IslandGround({ size, onGroundClick }: IslandGroundProps): ReactElement {
  const { hover, onMove, onLeave } = usePlacementHover(size);
  const { geometry, map } = useGrassSurface(size);
  const onClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    const point = worldToIsland(event.point.x, event.point.z, size);
    if (wasDrag(event) || !isOnIsland(cellOf(point), size)) return;
    onGroundClick(point);
  };
  return (
    <>
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, SURFACE_Y + 0.001, 0]}
        receiveShadow
        onPointerMove={onMove}
        onPointerOut={onLeave}
        onClick={onClick}
      >
        <meshStandardMaterial map={map} vertexColors />
      </mesh>
      {hover && <PlacementGhost cell={hover} size={size} />}
    </>
  );
}

/** A translucent preview of the selected crop under the pointer: white if it fits, red if not. */
function PlacementGhost({ cell, size }: { cell: Cell; size: number }): ReactElement | null {
  const game = useStore((state) => state.game);
  const selected = useStore((state) => state.selectedCrop);
  const ghost = useMemo(() => {
    if (!selected) return null;
    const placement: Placement = { x: cell[0], z: cell[1], footprint: getCrop(selected).footprint };
    return { placement, isValid: canPlace(game, placement, now()) };
  }, [selected, cell, game]);
  if (!ghost) return null;

  const [x, , z] = footprintCenter(ghost.placement, size);
  const { footprint } = ghost.placement;
  return (
    <mesh position={[x, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[footprint.w * 0.95, footprint.d * 0.95]} />
      <meshBasicMaterial color={ghost.isValid ? '#ffffff' : '#e0534a'} transparent opacity={0.45} />
    </mesh>
  );
}

export function Island(): ReactElement {
  const size = useStore((state) => state.game.islandSize);
  const crops = useStore((state) => state.game.crops);
  const selected = useStore((state) => state.selectedCrop);
  const dispatch = useStore((state) => state.dispatch);

  // With a crop picked, a click plants it in that cell without walking there (DESIGN.md "Open questions");
  // otherwise the player walks to the exact point.
  const onGroundClick = (point: IslandPoint): void => {
    const { x, z } = cellOf(point);
    if (selected) dispatch({ type: 'place', cropId: selected, x, z });
    else walkToPoint(point);
  };

  return (
    <group>
      <IslandBody size={size} />
      <TurfLip size={size} />
      <IslandGround size={size} onGroundClick={onGroundClick} />
      <PlacementGrid size={size} />
      <GrassTufts />
      {crops.map((plot) => (
        <CropPlot key={plot.uid} plot={plot} islandSize={size} />
      ))}
      <Walls />
      <Player />
    </group>
  );
}

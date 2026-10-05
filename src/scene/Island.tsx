import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { canPlace, getCrop } from '../game/index.ts';
import type { Placement } from '../game/index.ts';
import { now } from '../state/clock.ts';
import { walkToCell } from '../state/interaction.ts';
import { useStore } from '../state/store.ts';
import { CropPlot } from './CropPlot.tsx';
import { Player } from './Player.tsx';
import { Walls } from './Walls.tsx';
import { footprintCenter, worldToCell } from './coords.ts';

const SURFACE_Y = 0;

type Cell = [number, number];

interface PlacementHover {
  hover: Cell | null;
  onMove: (event: ThreeEvent<PointerEvent>) => void;
  onLeave: () => void;
}

/** Tracks which grid cell the pointer is over, updating state only when the cell changes. */
function usePlacementHover(size: number): PlacementHover {
  const [hover, setHover] = useState<Cell | null>(null);
  const onMove = (event: ThreeEvent<PointerEvent>): void => {
    const [x, z] = worldToCell(event.point.x, event.point.z, size);
    if (hover?.[0] !== x || hover[1] !== z) setHover([x, z]);
  };
  return { hover, onMove, onLeave: () => setHover(null) };
}

function IslandBody({ size }: { size: number }): ReactElement {
  return (
    <mesh position={[0, -0.4, 0]} receiveShadow castShadow>
      <boxGeometry args={[size + 0.6, 0.8, size + 0.6]} />
      <meshStandardMaterial color="#c9a86a" />
    </mesh>
  );
}

interface IslandGroundProps {
  size: number;
  onCellClick: (cell: Cell) => void;
}

/** The grass top: the click target for planting and walking, and the hover target for placement. */
function IslandGround({ size, onCellClick }: IslandGroundProps): ReactElement {
  const { hover, onMove, onLeave } = usePlacementHover(size);
  const onClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    onCellClick(worldToCell(event.point.x, event.point.z, size));
  };
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, SURFACE_Y + 0.001, 0]}
        receiveShadow
        onPointerMove={onMove}
        onPointerOut={onLeave}
        onClick={onClick}
      >
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#8fc46a" />
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

  // With a crop picked, a click plants it without walking there (DESIGN.md "Open questions"); otherwise the player walks.
  const onCellClick = ([x, z]: Cell): void => {
    if (selected) dispatch({ type: 'place', cropId: selected, x, z });
    else walkToCell(x, z);
  };

  return (
    <group>
      <IslandBody size={size} />
      <IslandGround size={size} onCellClick={onCellClick} />
      <gridHelper args={[size, size, '#6fa54d', '#7fb65a']} position={[0, SURFACE_Y + 0.01, 0]} />
      {crops.map((plot) => (
        <CropPlot key={plot.uid} plot={plot} islandSize={size} />
      ))}
      <Walls />
      <Player />
    </group>
  );
}

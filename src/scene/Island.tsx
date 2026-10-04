import { useMemo, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { canPlace, getCrop } from '../game/index.ts';
import { useStore } from '../state/store.ts';
import { CropPlot } from './CropPlot.tsx';
import { footprintCenter, worldToCell } from './coords.ts';

const SURFACE_Y = 0;

export function Island() {
  const size = useStore((s) => s.game.islandSize);
  const crops = useStore((s) => s.game.crops);
  const selected = useStore((s) => s.selectedCrop);
  const dispatch = useStore((s) => s.dispatch);
  const [hover, setHover] = useState<[number, number] | null>(null);

  const ghost = useMemo(() => {
    if (!selected || !hover) return null;
    const fp = getCrop(selected).footprint;
    return {
      fp,
      pos: footprintCenter(hover[0], hover[1], fp, size),
      ok: canPlace(crops, size, hover[0], hover[1], fp),
    };
  }, [selected, hover, crops, size]);

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const [x, z] = worldToCell(e.point.x, e.point.z, size);
    if (!hover || hover[0] !== x || hover[1] !== z) setHover([x, z]);
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!selected) return;
    e.stopPropagation();
    const [x, z] = worldToCell(e.point.x, e.point.z, size);
    dispatch({ type: 'place', cropId: selected, x, z });
  };

  return (
    <group>
      {/* Island body */}
      <mesh position={[0, -0.4, 0]} receiveShadow castShadow>
        <boxGeometry args={[size + 0.6, 0.8, size + 0.6]} />
        <meshStandardMaterial color="#c9a86a" />
      </mesh>

      {/* Grass top, also the click/hover target for placement */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, SURFACE_Y + 0.001, 0]}
        receiveShadow
        onPointerMove={onMove}
        onPointerOut={() => setHover(null)}
        onClick={onClick}
      >
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#8fc46a" />
      </mesh>

      <gridHelper args={[size, size, '#6fa54d', '#7fb65a']} position={[0, SURFACE_Y + 0.01, 0]} />

      {crops.map((plot) => (
        <CropPlot key={plot.uid} plot={plot} islandSize={size} />
      ))}

      {ghost && (
        <mesh position={[ghost.pos[0], 0.03, ghost.pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[ghost.fp.w * 0.95, ghost.fp.d * 0.95]} />
          <meshBasicMaterial color={ghost.ok ? '#ffffff' : '#e0534a'} transparent opacity={0.45} />
        </mesh>
      )}
    </group>
  );
}

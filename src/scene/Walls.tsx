import type { ReactElement } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { GridCell } from '../game/index.ts';
import { useStore } from '../state/store.ts';
import { cellCenter } from './coords.ts';

const WALL_COLOR = '#9a958a';
const WALL_HEIGHT = 1;

/** Clicking a wall does nothing, rather than reaching the ground cell behind it. */
function ignoreClick(event: ThreeEvent<MouseEvent>): void {
  event.stopPropagation();
}

function Wall({ cell, islandSize }: { cell: GridCell; islandSize: number }): ReactElement {
  const [x, , z] = cellCenter(cell, islandSize);
  return (
    <mesh position={[x, WALL_HEIGHT / 2, z]} castShadow receiveShadow onClick={ignoreClick}>
      <boxGeometry args={[1, WALL_HEIGHT, 1]} />
      <meshStandardMaterial color={WALL_COLOR} flatShading />
    </mesh>
  );
}

export function Walls(): ReactElement {
  const walls = useStore((state) => state.game.walls);
  const islandSize = useStore((state) => state.game.islandSize);
  return (
    <>
      {walls.map((cell) => (
        <Wall key={`${cell.x},${cell.z}`} cell={cell} islandSize={islandSize} />
      ))}
    </>
  );
}

import { useMemo } from 'react';
import type { ReactElement } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { cellKey, getDecoration, rotatedFootprint } from '../game/index.ts';
import type { PlacedDecoration } from '../game/index.ts';
import { tapDecoration } from '../state/interaction.ts';
import { useStore } from '../state/store.ts';
import { footprintCenter, worldToIsland } from './coords.ts';
import { DecorationModel } from './models/DecorationModel.tsx';
import { fenceRails } from './models/fenceRails.ts';
import type { Side } from './models/fenceRails.ts';
import { wasDrag } from './pointer.ts';

const FENCE_ID = 'wooden-fence';

/** `cellKey`s of every fence on the island, so neighbouring fences can join up. */
export function useFenceCells(): Set<string> {
  const decorations = useStore((state) => state.game.decorations);
  return useMemo(
    () => new Set(decorations.filter((placed) => placed.decorationId === FENCE_ID).map(cellKey)),
    [decorations],
  );
}

type Spot = Pick<PlacedDecoration, 'decorationId' | 'x' | 'z' | 'rotation'>;

/** The sides a decoration's rails run to; only fences have any. */
export function railsFor(spot: Spot, fences: Set<string>): Side[] {
  return spot.decorationId === FENCE_ID ? fenceRails(spot, fences, spot.rotation) : [];
}

/** Where a placed item's model is centred, in world space. */
export function placedCenter(placed: PlacedDecoration, islandSize: number): [number, number, number] {
  const footprint = rotatedFootprint(getDecoration(placed.decorationId).footprint, placed.rotation);
  return footprintCenter({ x: placed.x, z: placed.z, footprint }, islandSize);
}

interface PlacedProps {
  placed: PlacedDecoration;
  islandSize: number;
  fences: Set<string>;
}

/** A tap on a decoration never reaches the ground behind it; in build mode it moves the ghost there. */
function PlacedDecorationModel({ placed, islandSize, fences }: PlacedProps): ReactElement {
  const onClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    if (!wasDrag(event)) tapDecoration(worldToIsland(event.point.x, event.point.z, islandSize));
  };
  return (
    <group position={placedCenter(placed, islandSize)} onClick={onClick}>
      <DecorationModel decoration={getDecoration(placed.decorationId)} look="solid" rails={railsFor(placed, fences)} />
    </group>
  );
}

/** Walls, fences, hedges and flower beds, with neighbouring fences joined up. */
export function Decorations(): ReactElement {
  const decorations = useStore((state) => state.game.decorations);
  const islandSize = useStore((state) => state.game.islandSize);
  const fences = useFenceCells();
  return (
    <>
      {decorations.map((placed) => (
        <PlacedDecorationModel key={placed.uid} placed={placed} islandSize={islandSize} fences={fences} />
      ))}
    </>
  );
}

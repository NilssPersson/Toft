import type { ReactElement } from 'react';
import { Html } from '@react-three/drei';
import { getCrop, getDecoration } from '../../game/index.ts';
import { buildStatus, draftPlacement } from '../../state/build.ts';
import { now } from '../../state/clock.ts';
import { useStore } from '../../state/store.ts';
import type { BuildDraft } from '../../state/store.ts';
import { BuildControls } from '../../ui/BuildControls.tsx';
import { footprintCenter } from '../coords.ts';
import { railsFor, useFenceCells } from '../Decorations.tsx';
import { CropModel } from '../models/CropModel.tsx';
import { DecorationModel } from '../models/DecorationModel.tsx';
import type { ModelLook } from '../models/ModelMaterial.tsx';
import { positionInSafeArea } from './safeArea.ts';
import { useGhostDrag } from './useGhostDrag.ts';

/** How high above the ground the ✕/✓ buttons float, in cells. */
const CONTROLS_HEIGHT = 1.5;
const HIT_HEIGHT = 1;
/** Below the HUD panels (z-index 1 and up), so an open panel covers the buttons rather than the other way round. */
const CONTROLS_Z_INDEX = [0, 0];

function GhostModel({ draft, look }: { draft: BuildDraft; look: ModelLook }): ReactElement {
  const fences = useFenceCells();
  if (draft.kind === 'crop') return <CropModel crop={getCrop(draft.itemId)} look={look} />;
  const spot = { decorationId: draft.itemId, ...draft.cell, rotation: draft.rotation };
  return <DecorationModel decoration={getDecoration(draft.itemId)} look={look} rails={railsFor(spot, fences)} />;
}

/** An invisible box over the footprint, so the whole ghost is easy to grab, not just its thin parts. */
function GrabArea({ width, depth }: { width: number; depth: number }): ReactElement {
  return (
    <mesh position={[0, HIT_HEIGHT / 2, 0]}>
      <boxGeometry args={[width, HIT_HEIGHT, depth]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  );
}

function useGhostLook(): ModelLook {
  const isValid = useStore((state) => buildStatus(state.game, state.buildDraft, now()) === 'valid');
  return isValid ? 'ghost' : 'ghost-invalid';
}

/** Build mode's ghost: the item's model in grey (red where it can't go), snapped to the grid, with ✕/✓ above it. */
export function BuildGhost(): ReactElement | null {
  const draft = useStore((state) => state.buildDraft);
  const islandSize = useStore((state) => state.game.islandSize);
  const look = useGhostLook();
  const drag = useGhostDrag(islandSize);
  if (!draft) return null;
  const placement = draftPlacement(draft);
  return (
    <group position={footprintCenter(placement, islandSize)}>
      <group {...drag}>
        <GhostModel draft={draft} look={look} />
        <GrabArea width={placement.footprint.w} depth={placement.footprint.d} />
      </group>
      <Html
        position={[0, CONTROLS_HEIGHT, 0]}
        center
        calculatePosition={positionInSafeArea}
        zIndexRange={CONTROLS_Z_INDEX}
      >
        <BuildControls />
      </Html>
    </group>
  );
}

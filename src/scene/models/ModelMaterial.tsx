import type { ReactElement } from 'react';
import { Edges } from '@react-three/drei';

/** How a model is drawn: as itself, or as the build ghost (grey, or red where it can't go). */
export type ModelLook = 'solid' | 'ghost' | 'ghost-invalid';

type GhostLook = Exclude<ModelLook, 'solid'>;

const GHOST_OPACITY = 0.55;
const GHOST_FILL: Record<GhostLook, string> = { ghost: '#b8b8b8', 'ghost-invalid': '#e0534a' };
/** A shade brighter than the fill, so the ghost's shape reads against the grass. */
const GHOST_OUTLINE: Record<GhostLook, string> = { ghost: '#f4f4f4', 'ghost-invalid': '#ffb3ad' };

interface ModelMaterialProps {
  color: string;
  look: ModelLook;
}

/** The material for one mesh of a model: its own colour, or flat semi-transparent grey with a bright outline. */
export function ModelMaterial({ color, look }: ModelMaterialProps): ReactElement {
  if (look === 'solid') return <meshStandardMaterial color={color} flatShading />;
  return (
    <>
      <meshBasicMaterial color={GHOST_FILL[look]} transparent opacity={GHOST_OPACITY} depthWrite={false} />
      <Edges color={GHOST_OUTLINE[look]} />
    </>
  );
}

/** Ghosts don't cast or catch shadows. */
export function castsShadow(look: ModelLook): boolean {
  return look === 'solid';
}

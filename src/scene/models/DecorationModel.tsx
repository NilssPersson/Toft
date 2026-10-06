import type { ReactElement } from 'react';
import type { DecorationDef } from '../../game/index.ts';
import { SIDE_STEPS } from './fenceRails.ts';
import type { Side } from './fenceRails.ts';
import { ModelMaterial, castsShadow } from './ModelMaterial.tsx';
import type { ModelLook } from './ModelMaterial.tsx';

const WALL_SIZE = 0.96;
const HEDGE_SIZE: [number, number, number] = [0.9, 0.8, 0.9];
const POST_SIZE: [number, number, number] = [0.14, 0.75, 0.14];
const RAIL_HEIGHTS = [0.28, 0.55];
const RAIL_THICKNESS = 0.07;
const BED_SOIL_COLOR = '#7a5236';
const BED_HEIGHT = 0.14;
const FLOWER_RADIUS = 0.09;
/** Where the flowers in a bed sit, in cell units from its centre. */
const FLOWER_SPOTS: [number, number][] = [
  [-0.22, -0.22],
  [0.2, -0.18],
  [0, 0.02],
  [-0.2, 0.22],
  [0.22, 0.2],
];

export interface DecorationModelProps {
  decoration: DecorationDef;
  look: ModelLook;
  /** Fences only: the sides their rails run to. */
  rails: Side[];
}

interface BoxProps {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
  look: ModelLook;
}

function Box({ size, position, color, look }: BoxProps): ReactElement {
  return (
    <mesh position={position} castShadow={castsShadow(look)} receiveShadow={castsShadow(look)}>
      <boxGeometry args={size} />
      <ModelMaterial color={color} look={look} />
    </mesh>
  );
}

function StoneWall({ decoration, look }: DecorationModelProps): ReactElement {
  const size: [number, number, number] = [WALL_SIZE, WALL_SIZE, WALL_SIZE];
  return <Box size={size} position={[0, WALL_SIZE / 2, 0]} color={decoration.color} look={look} />;
}

function Hedge({ decoration, look }: DecorationModelProps): ReactElement {
  return <Box size={HEDGE_SIZE} position={[0, HEDGE_SIZE[1] / 2, 0]} color={decoration.color} look={look} />;
}

/** Two rails from the post to one side of the cell, where they meet the next fence's. */
function FenceRail({ side, color, look }: { side: Side; color: string; look: ModelLook }): ReactElement {
  const step = SIDE_STEPS[side];
  const length = 0.5;
  const size: [number, number, number] = [
    step.x === 0 ? RAIL_THICKNESS : length,
    RAIL_THICKNESS,
    step.z === 0 ? RAIL_THICKNESS : length,
  ];
  return (
    <>
      {RAIL_HEIGHTS.map((height) => (
        <Box key={height} size={size} position={[step.x * 0.25, height, step.z * 0.25]} color={color} look={look} />
      ))}
    </>
  );
}

function Fence({ decoration, look, rails }: DecorationModelProps): ReactElement {
  return (
    <group>
      <Box size={POST_SIZE} position={[0, POST_SIZE[1] / 2, 0]} color={decoration.color} look={look} />
      {rails.map((side) => (
        <FenceRail key={side} side={side} color={decoration.color} look={look} />
      ))}
    </group>
  );
}

function FlowerBed({ decoration, look }: DecorationModelProps): ReactElement {
  return (
    <group>
      <Box size={[0.9, BED_HEIGHT, 0.9]} position={[0, BED_HEIGHT / 2, 0]} color={BED_SOIL_COLOR} look={look} />
      {FLOWER_SPOTS.map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, BED_HEIGHT + FLOWER_RADIUS, z]} castShadow={castsShadow(look)}>
          <icosahedronGeometry args={[FLOWER_RADIUS, 0]} />
          <ModelMaterial color={decoration.color} look={look} />
        </mesh>
      ))}
    </group>
  );
}

/** Placeholder models until real ones exist, one per decoration; an unknown one is drawn as a stone wall. */
const MODELS: Record<string, (props: DecorationModelProps) => ReactElement> = {
  'stone-wall': StoneWall,
  'wooden-fence': Fence,
  hedge: Hedge,
  'flower-bed': FlowerBed,
};

/** A decoration's model, centred on its footprint. */
export function DecorationModel(props: DecorationModelProps): ReactElement {
  const Model = MODELS[props.decoration.id] ?? StoneWall;
  return <Model {...props} />;
}

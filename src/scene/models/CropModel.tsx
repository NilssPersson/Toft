import type { ReactElement } from 'react';
import type { CropDef } from '../../game/index.ts';
import { ModelMaterial, castsShadow } from './ModelMaterial.tsx';
import type { ModelLook } from './ModelMaterial.tsx';

const SOIL_COLOR = '#6b4a2f';

interface CropPartProps {
  crop: CropDef;
  look: ModelLook;
}

export function SoilBed({ crop, look }: CropPartProps): ReactElement {
  return (
    <mesh position={[0, 0.05, 0]} receiveShadow={castsShadow(look)}>
      <boxGeometry args={[crop.footprint.w * 0.9, 0.1, crop.footprint.d * 0.9]} />
      <ModelMaterial color={SOIL_COLOR} look={look} />
    </mesh>
  );
}

export function PlantCone({ crop, look }: CropPartProps): ReactElement {
  const radius = 0.32 * Math.min(crop.footprint.w, crop.footprint.d) + 0.05;
  return (
    <mesh position={[0, 0.45, 0]} castShadow={castsShadow(look)}>
      <coneGeometry args={[radius, 0.8, 7]} />
      <ModelMaterial color={crop.color} look={look} />
    </mesh>
  );
}

/** A fully grown crop on its soil bed: what the build ghost shows. */
export function CropModel({ crop, look }: CropPartProps): ReactElement {
  return (
    <group>
      <SoilBed crop={crop} look={look} />
      <PlantCone crop={crop} look={look} />
    </group>
  );
}

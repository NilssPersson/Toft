import { useEffect, useMemo } from 'react';
import type { ReactElement } from 'react';
import { useFrame } from '@react-three/fiber';
import { PlaneGeometry } from 'three';
import type { ShaderMaterial } from 'three';
import { useStore } from '../../state/store.ts';
import { prefersReducedMotion } from '../../ui/motion.ts';
import { lawnWidth } from '../grass/patches.ts';
import { OCEAN } from './config.ts';
import { createOceanMaterial, createOceanUniforms, setOceanTime } from './oceanMaterial.ts';

/** The sea never takes clicks, so a click past the island's edge does nothing. */
function ignoreRaycast(): void {
  // Intentionally empty: an object that adds no intersections is invisible to the pointer.
}

interface OceanParts {
  geometry: PlaneGeometry;
  material: ShaderMaterial;
}

/** Geometry and material, rebuilt only if the island changes size; the waves tick through a uniform. */
function useOceanParts(islandSize: number): OceanParts {
  const parts = useMemo(() => {
    const uniforms = createOceanUniforms(lawnWidth(islandSize) / 2);
    const geometry = new PlaneGeometry(OCEAN.size, OCEAN.size, OCEAN.segments, OCEAN.segments);
    return { geometry, material: createOceanMaterial(uniforms), uniforms, canMove: !prefersReducedMotion() };
  }, [islandSize]);
  useEffect(() => {
    return () => {
      parts.geometry.dispose();
      parts.material.dispose();
    };
  }, [parts]);
  useFrame(({ clock }) => {
    if (parts.canMove) setOceanTime(parts.uniforms, clock.elapsedTime);
  });
  return parts;
}

/** A cartoon sea: toon depth bands, foam lapping at the shore, ripples rolling out and little wave crests. */
export function Ocean(): ReactElement {
  const islandSize = useStore((state) => state.game.islandSize);
  const { geometry, material } = useOceanParts(islandSize);
  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, OCEAN.level, 0]}
      raycast={ignoreRaycast}
    />
  );
}

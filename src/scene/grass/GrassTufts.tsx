import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { ReactElement, RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D } from 'three';
import type { BufferGeometry, InstancedMesh, Material } from 'three';
import { blockedCells } from '../../game/index.ts';
import { isPhone } from '../../pwa/orientation.ts';
import { useStore } from '../../state/store.ts';
import { prefersReducedMotion } from '../../ui/motion.ts';
import { GRASS } from './config.ts';
import { groundTint } from './patches.ts';
import { scatterTufts, tuftsPerCell } from './scatter.ts';
import type { Tuft } from './scatter.ts';
import { createSwayMaterial, createSwayUniforms, setSwayTime } from './swayMaterial.ts';
import { createTuftGeometry } from './tuftGeometry.ts';

const PHONE_TUFT_SHARE = 0.5;

/** Tufts never take clicks: the ground under them gets them, for walking and planting. */
function ignoreRaycast(): void {
  // Intentionally empty: an object that adds no intersections is invisible to the pointer.
}

function tuftCapacity(): number {
  return Math.floor(GRASS.tufts.maxCount * (isPhone() ? PHONE_TUFT_SHARE : 1));
}

/** The tufts for the current island, recomputed only when crops or walls change. */
function useLawn(capacity: number): Lawn {
  const islandSize = useStore((state) => state.game.islandSize);
  const crops = useStore((state) => state.game.crops);
  const walls = useStore((state) => state.game.walls);
  return useMemo(() => {
    const perCell = tuftsPerCell(islandSize, capacity);
    return { tufts: scatterTufts({ islandSize, blocked: blockedCells({ crops, walls }), perCell }), islandSize };
  }, [islandSize, crops, walls, capacity]);
}

interface Lawn {
  tufts: Tuft[];
  islandSize: number;
}

const TIP_COLORS = GRASS.tufts.tipColors.map((hex) => new Color(hex));

/** The tuft's own tip colour, tinted like the lawn under it so tufts follow the sunny and shady patches. */
function tuftColor(tuft: Tuft, islandSize: number, color: Color): Color {
  const [red, green, blue] = groundTint(tuft.x, tuft.z, islandSize);
  const [sunny, fresh] = TIP_COLORS;
  if (sunny && fresh) color.copy(sunny).lerp(fresh, tuft.tint);
  return color.setRGB(color.r * red, color.g * green, color.b * blue);
}

/** Writes each tuft's transform and colour into the instance buffers. */
function writeInstances(mesh: InstancedMesh, { tufts, islandSize }: Lawn): void {
  const placer = new Object3D();
  const color = new Color();
  tufts.forEach((tuft, i) => {
    placer.position.set(tuft.x, 0, tuft.z);
    placer.rotation.set(0, tuft.rotation, 0);
    placer.scale.setScalar(tuft.height);
    placer.updateMatrix();
    mesh.setMatrixAt(i, placer.matrix);
    mesh.setColorAt(i, tuftColor(tuft, islandSize, color));
  });
  mesh.count = tufts.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

function useInstances(lawn: Lawn): RefObject<InstancedMesh | null> {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (mesh.current) writeInstances(mesh.current, lawn);
  }, [lawn]);
  return mesh;
}

interface TuftParts {
  geometry: BufferGeometry;
  material: Material;
}

/** Geometry and material are built once and disposed with the tufts; the sway time ticks through a uniform. */
function useTuftParts(): TuftParts {
  const parts = useMemo(() => {
    const canSway = !prefersReducedMotion();
    const uniforms = createSwayUniforms(canSway);
    return { geometry: createTuftGeometry(), material: createSwayMaterial(uniforms), uniforms, canSway };
  }, []);
  useEffect(() => {
    return () => {
      parts.geometry.dispose();
      parts.material.dispose();
    };
  }, [parts]);
  useFrame(({ clock }) => {
    if (parts.canSway) setSwayTime(parts.uniforms, clock.elapsedTime);
  });
  return parts;
}

/** Low-poly grass tufts over the lawn, all in one draw call, skipping cells with crops or walls. */
export function GrassTufts(): ReactElement {
  const capacity = useMemo(() => tuftCapacity(), []);
  const mesh = useInstances(useLawn(capacity));
  const { geometry, material } = useTuftParts();
  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, capacity]}
      raycast={ignoreRaycast}
      frustumCulled={false}
      receiveShadow
    />
  );
}

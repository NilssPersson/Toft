import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Float32BufferAttribute, PlaneGeometry } from 'three';
import type { Texture } from 'three';
import { GRASS } from './config.ts';
import { grassTexture } from './grassTexture.ts';
import { groundTint, lawnWidth } from './patches.ts';

export interface GrassSurface {
  geometry: PlaneGeometry;
  map: Texture;
}

/**
 * The lawn as a finely divided plane, over the playable cells and the verge around them. Its UVs repeat the detail texture about once or twice per cell, and its
 * vertex colours carry the large patches and the darker edge, which never repeat across the island.
 */
export function createGroundGeometry(islandSize: number): PlaneGeometry {
  const width = lawnWidth(islandSize);
  const segments = Math.round(width * GRASS.patches.verticesPerCell);
  const geometry = new PlaneGeometry(width, width, segments, segments);
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  const colors: number[] = [];
  const repeat = width * GRASS.texture.repeatPerCell;
  for (let i = 0; i < position.count; i++) {
    // The plane is laid flat with its local y pointing to world -z.
    colors.push(...groundTint(position.getX(i), -position.getY(i), islandSize));
    uv.setXY(i, uv.getX(i) * repeat, uv.getY(i) * repeat);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geometry;
}

/** The ground geometry for this island size, and the shared grass texture with the renderer's best anisotropy. */
export function useGrassSurface(islandSize: number): GrassSurface {
  const renderer = useThree((state) => state.gl);
  const map = useMemo(() => grassTexture(renderer.capabilities.getMaxAnisotropy()), [renderer]);
  const geometry = useMemo(() => createGroundGeometry(islandSize), [islandSize]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return { geometry, map };
}

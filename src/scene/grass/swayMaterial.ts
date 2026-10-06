// The tufts' material: Lambert lighting plus a gentle wind sway added in the vertex shader.
// Only a time uniform changes per frame; nothing is allocated while the game runs.
import { MeshLambertMaterial } from 'three';
import type { IUniform } from 'three';
import { GRASS } from './config.ts';

export interface SwayUniforms {
  [name: string]: IUniform<number>;
  uTime: IUniform<number>;
  uSway: IUniform<number>;
  uSwaySpeed: IUniform<number>;
}

const SWAY_DECLARATIONS = /* glsl */ `
uniform float uTime;
uniform float uSway;
uniform float uSwaySpeed;
`;

/**
 * three.js's project_vertex, with the sway between the instance transform and the camera. Blades bend more
 * the higher up they are, and the phase follows world position so the wind rolls across the lawn.
 */
const SWAY_PROJECT_VERTEX = /* glsl */ `
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
float swayBend = mvPosition.y * mvPosition.y * uSway;
float swayPhase = uTime * uSwaySpeed + mvPosition.x * 0.9 + mvPosition.z * 0.7;
mvPosition.x += sin( swayPhase ) * swayBend;
mvPosition.z += sin( swayPhase * 0.8 + 1.3 ) * swayBend * 0.5;
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;
`;

/** Sway uniforms; with no sway (reduced motion) the tufts stand still. */
export function createSwayUniforms(canSway: boolean): SwayUniforms {
  const [, tallest] = GRASS.tufts.height;
  const sway = canSway ? GRASS.tufts.swayStrength / (tallest * tallest) : 0;
  return { uTime: { value: 0 }, uSway: { value: sway }, uSwaySpeed: { value: GRASS.tufts.swaySpeed } };
}

/** Moves the wind on; called every frame, so it only writes a number. */
export function setSwayTime(uniforms: SwayUniforms, seconds: number): void {
  uniforms.uTime.value = seconds;
}

export function createSwayMaterial(uniforms: SwayUniforms): MeshLambertMaterial {
  const material = new MeshLambertMaterial({ vertexColors: true });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      SWAY_DECLARATIONS + shader.vertexShader.replace('#include <project_vertex>', SWAY_PROJECT_VERTEX);
  };
  return material;
}

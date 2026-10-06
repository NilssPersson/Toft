// The sea's material: flat cartoon colours, foam and wave crests drawn in one shader, so the whole ocean is a
// single draw call. Not tone mapped, so the foam stays white and the colours are exactly those in `OCEAN`.
// Only a time uniform changes per frame; nothing is allocated while the game runs.
import { Color, ShaderMaterial } from 'three';
import type { IUniform } from 'three';
import { OCEAN } from './config.ts';

export interface OceanUniforms {
  [name: string]: IUniform<number | Color>;
  uTime: IUniform<number>;
}

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uSwellHeight;
uniform float uSwellLength;
uniform float uSwellSpeed;
varying vec2 vWorld;

void main() {
  vec4 world = modelMatrix * vec4( position, 1.0 );
  float phase = uTime * uSwellSpeed;
  float across = sin( world.x / uSwellLength + phase );
  float along = sin( world.z / uSwellLength * 1.3 - phase * 0.7 );
  world.y += uSwellHeight * ( across + along );
  vWorld = world.xz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform float uIslandHalf;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform vec3 uFoam;
uniform float uDepthBands;
uniform float uDepthReach;
uniform float uShoreFoamWidth;
uniform float uShoreFoamWobble;
uniform float uShoreFoamSpeed;
uniform float uRippleSpacing;
uniform float uRippleWidth;
uniform float uRippleSpeed;
uniform float uRippleReach;
uniform float uCrestSpacing;
uniform float uCrestRadius;
uniform float uCrestWidth;
uniform float uCrestSpeed;
uniform float uCrestMinDistance;
varying vec2 vWorld;

const float TAU = 6.2831853;

float hash( vec2 cell ) {
  return fract( sin( dot( cell, vec2( 127.1, 311.7 ) ) ) * 43758.5453 );
}

// How far a point is from the island's square edge; negative under the island.
float shoreDistance( vec2 point ) {
  vec2 outside = abs( point ) - vec2( uIslandHalf );
  return length( max( outside, 0.0 ) ) + min( max( outside.x, outside.y ), 0.0 );
}

// Shallow turquoise by the shore, stepping down to deep blue in flat bands.
vec3 depthColor( float fromShore ) {
  float band = floor( clamp( fromShore / uDepthReach, 0.0, 0.999 ) * uDepthBands ) / ( uDepthBands - 1.0 );
  return mix( uShallow, uDeep, band );
}

// A wobbly white rim where the water meets the island.
float shoreFoam( vec2 point, float fromShore ) {
  float time = uTime * uShoreFoamSpeed;
  float wobble = uShoreFoamWobble * ( sin( point.x * 1.7 + time ) + sin( point.y * 2.3 - time * 0.8 ) );
  return step( fromShore, uShoreFoamWidth + wobble );
}

// Thin rings rolling out from the shore, fading as they go.
float ripples( float fromShore ) {
  float wave = fract( fromShore / uRippleSpacing - uTime * uRippleSpeed );
  float line = step( 1.0 - uRippleWidth / uRippleSpacing, wave );
  return line * ( 1.0 - smoothstep( 0.0, uRippleReach, fromShore ) );
}

// One little arch per grid square, at a random spot, growing and shrinking out of step with its neighbours.
float crests( vec2 point, float fromShore ) {
  vec2 cell = floor( point / uCrestSpacing );
  vec2 jitter = vec2( hash( cell + 17.0 ), hash( cell + 31.0 ) ) - 0.5;
  vec2 centre = ( cell + 0.5 + jitter * 0.5 ) * uCrestSpacing;
  float life = sin( uTime * uCrestSpeed + hash( cell ) * TAU );
  float radius = uCrestRadius * smoothstep( 0.0, 1.0, life );
  vec2 local = point - centre;
  float arc = abs( length( local + vec2( 0.0, radius * 0.5 ) ) - radius );
  float isArch = step( arc, uCrestWidth ) * step( 0.0, local.y ) * step( 0.05, radius );
  return isArch * step( uCrestMinDistance, fromShore );
}

void main() {
  float fromShore = shoreDistance( vWorld );
  float foam = max( shoreFoam( vWorld, fromShore ), max( ripples( fromShore ), crests( vWorld, fromShore ) ) );
  gl_FragColor = vec4( mix( depthColor( fromShore ), uFoam, foam ), 1.0 );
  #include <colorspace_fragment>
}
`;

function numberUniforms(values: Record<string, number>): Record<string, IUniform<number>> {
  return Object.fromEntries(Object.entries(values).map(([name, value]) => [name, { value }]));
}

/** Every uniform the sea needs, from `OCEAN`. `islandHalf` is half the width of the lawn the water laps against. */
export function createOceanUniforms(islandHalf: number): OceanUniforms {
  const { colors, depth, shoreFoam, ripples, crests, swell } = OCEAN;
  return {
    uTime: { value: 0 },
    uShallow: { value: new Color(colors.shallow) },
    uDeep: { value: new Color(colors.deep) },
    uFoam: { value: new Color(colors.foam) },
    ...numberUniforms({ uIslandHalf: islandHalf, uDepthBands: depth.bands, uDepthReach: depth.reach }),
    ...numberUniforms({ uShoreFoamWidth: shoreFoam.width, uShoreFoamWobble: shoreFoam.wobble }),
    ...numberUniforms({ uShoreFoamSpeed: shoreFoam.speed, uRippleSpacing: ripples.spacing }),
    ...numberUniforms({ uRippleWidth: ripples.width, uRippleSpeed: ripples.speed, uRippleReach: ripples.reach }),
    ...numberUniforms({ uCrestSpacing: crests.spacing, uCrestRadius: crests.radius, uCrestWidth: crests.width }),
    ...numberUniforms({ uCrestSpeed: crests.speed, uCrestMinDistance: crests.minDistance }),
    ...numberUniforms({ uSwellHeight: swell.height, uSwellLength: swell.length, uSwellSpeed: swell.speed }),
  };
}

/** Moves the waves on; called every frame, so it only writes a number. */
export function setOceanTime(uniforms: OceanUniforms, seconds: number): void {
  uniforms.uTime.value = seconds;
}

export function createOceanMaterial(uniforms: OceanUniforms): ShaderMaterial {
  return new ShaderMaterial({
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    toneMapped: false,
  });
}

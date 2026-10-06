// The lawn's detail texture, drawn once on a canvas at runtime: no image is shipped.
// Soft, low-contrast blade strokes and fine noise over a bright green, so crops and the player stand out.
import { CanvasTexture, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from 'three';
import { GRASS } from './config.ts';
import { lerp, seededRandom } from './random.ts';

type Random = () => number;

interface Blade {
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
  color: string;
}

const BLADE_ALPHA = 0.55;
const BLADE_WIDTH: [number, number] = [1, 2.2];
/** Offsets that draw a stroke again on the opposite side of every edge it crosses, so the texture tiles seamlessly. */
const WRAP_STEPS = [-1, 0, 1];
const MAX_BYTE = 255;

let cachedTexture: CanvasTexture | undefined;

function pick<T>(items: readonly T[], random: Random): T | undefined {
  return items[Math.floor(random() * items.length)];
}

function fillBase(context: CanvasRenderingContext2D, size: number): void {
  context.fillStyle = GRASS.texture.baseColor;
  context.fillRect(0, 0, size, size);
}

/** Per-pixel brightness noise. Each pixel is independent, so it tiles by construction. */
function addNoise(context: CanvasRenderingContext2D, size: number, random: Random): void {
  const image = context.getImageData(0, 0, size, size);
  const { data } = image;
  const amount = GRASS.texture.noiseAmount * MAX_BYTE;
  for (let i = 0; i < data.length; i += 4) {
    const offset = (random() * 2 - 1) * amount;
    data[i] = (data[i] ?? 0) + offset;
    data[i + 1] = (data[i + 1] ?? 0) + offset;
    data[i + 2] = (data[i + 2] ?? 0) + offset;
  }
  context.putImageData(image, 0, 0);
}

function randomBlade(size: number, random: Random): Blade {
  const [shortest, longest] = GRASS.texture.bladeLength;
  return {
    x: random() * size,
    y: random() * size,
    angle: random() * Math.PI * 2,
    length: lerp(shortest, longest, random()),
    width: lerp(BLADE_WIDTH[0], BLADE_WIDTH[1], random()),
    color: pick(GRASS.texture.bladeColors, random) ?? GRASS.texture.baseColor,
  };
}

/** A tapered stroke: wide at the root, pointed at the tip. */
function traceBlade(context: CanvasRenderingContext2D, blade: Blade, origin: [number, number]): void {
  const [x, y] = origin;
  const sideX = Math.cos(blade.angle + Math.PI / 2) * (blade.width / 2);
  const sideY = Math.sin(blade.angle + Math.PI / 2) * (blade.width / 2);
  context.moveTo(x - sideX, y - sideY);
  context.lineTo(x + Math.cos(blade.angle) * blade.length, y + Math.sin(blade.angle) * blade.length);
  context.lineTo(x + sideX, y + sideY);
  context.closePath();
}

/** Draws the blade at every wrapped position, so strokes that cross an edge continue on the other side. */
function drawWrappedBlade(context: CanvasRenderingContext2D, blade: Blade, size: number): void {
  context.fillStyle = blade.color;
  context.beginPath();
  for (const stepX of WRAP_STEPS) {
    for (const stepY of WRAP_STEPS) traceBlade(context, blade, [blade.x + stepX * size, blade.y + stepY * size]);
  }
  context.fill();
}

function drawBlades(context: CanvasRenderingContext2D, size: number, random: Random): void {
  context.globalAlpha = BLADE_ALPHA;
  for (let i = 0; i < GRASS.texture.bladeCount; i++) drawWrappedBlade(context, randomBlade(size, random), size);
  context.globalAlpha = 1;
}

function drawGrass(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const random = seededRandom(GRASS.seed);
  fillBase(context, size);
  addNoise(context, size, random);
  drawBlades(context, size, random);
  return canvas;
}

function createGrassTexture(maxAnisotropy: number): CanvasTexture {
  const texture = new CanvasTexture(drawGrass(GRASS.texture.size));
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/** The grass detail texture, drawn on first use and shared after that. Its repeat is set by whoever shows it. */
export function grassTexture(maxAnisotropy: number): CanvasTexture {
  cachedTexture ??= createGrassTexture(maxAnisotropy);
  return cachedTexture;
}

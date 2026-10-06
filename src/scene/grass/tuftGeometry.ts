// One grass tuft, one unit tall: a few crossed, tapered blades leaning slightly outward.
// Every vertex normal points up, so tufts light like the lawn they grow from instead of flickering as they turn.
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { GRASS } from './config.ts';

type Point = [number, number, number];

const BLADES_PER_TUFT = 3;
/** Width at the bend, relative to the root, and how high the bend is. */
const BEND_WIDTH = 0.7;
const BEND_HEIGHT = 0.55;
const BEND_LEAN = 0.06;
const TIP_LEAN = 0.2;

interface Mesh {
  positions: number[];
  shades: number[];
}

/** The blade's outline in its own plane: root corners, bend corners, tip. `x` across, `y` up, `z` lean. */
function bladeOutline(width: number): Point[] {
  const half = width / 2;
  const bend = half * BEND_WIDTH;
  return [
    [-half, 0, 0],
    [half, 0, 0],
    [-bend, BEND_HEIGHT, BEND_LEAN],
    [bend, BEND_HEIGHT, BEND_LEAN],
    [0, 1, TIP_LEAN],
  ];
}

/** Root, bend, tip as triangles, listed once per side so the blade shows from both sides with upward normals. */
const FRONT_TRIANGLES = [0, 1, 3, 0, 3, 2, 2, 3, 4];
const BACK_TRIANGLES = [0, 3, 1, 0, 2, 3, 2, 4, 3];

function turn([x, y, z]: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos + z * sin, y, -x * sin + z * cos];
}

function addBlade(mesh: Mesh, angle: number, width: number): void {
  const outline = bladeOutline(width).map((point) => turn(point, angle));
  const { rootShade } = GRASS.tufts;
  for (const index of [...FRONT_TRIANGLES, ...BACK_TRIANGLES]) {
    const point = outline[index] ?? [0, 0, 0];
    mesh.positions.push(...point);
    const shade = rootShade + (1 - rootShade) * point[1];
    mesh.shades.push(shade, shade, shade);
  }
}

/** A unit-tall tuft; instances scale it to their height. Vertex colours shade each blade from root to tip. */
export function createTuftGeometry(): BufferGeometry {
  const mesh: Mesh = { positions: [], shades: [] };
  const [, tallest] = GRASS.tufts.height;
  const width = GRASS.tufts.bladeWidth / tallest;
  for (let i = 0; i < BLADES_PER_TUFT; i++) addBlade(mesh, (i * Math.PI) / BLADES_PER_TUFT, width);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(mesh.positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(mesh.shades, 3));
  const upNormals = mesh.positions.map((_, i) => (i % 3 === 1 ? 1 : 0));
  geometry.setAttribute('normal', new Float32BufferAttribute(upNormals, 3));
  return geometry;
}

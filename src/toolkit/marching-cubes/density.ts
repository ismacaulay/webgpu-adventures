import SimplexNoise from 'simplex-noise';
import PNRG from 'alea';
import { lerp } from 'toolkit/math';
import { vec3 } from 'gl-matrix';

export type DensityFn = (idx: vec3) => number;

export function createSphereDensityFn({
  radius,
  centre,
}: {
  radius: number;
  centre: vec3;
}): DensityFn {
  const p = vec3.create();

  let l: number;
  return function sphereDensityFn(idx: vec3) {
    l = vec3.length(vec3.sub(p, centre, idx));
    return radius - l;
  };
}

export function createEllipsoidDensityFn({
  a,
  b,
  c,
  centre,
}: {
  a: number;
  b: number;
  c: number;
  centre: vec3;
}) {
  const a2 = a * a;
  const b2 = b * b;
  const c2 = c * c;

  let x, y, z;
  const p = vec3.create();

  return function ellipsoidDensityFn(idx: vec3) {
    vec3.sub(p, idx, centre);
    [x, y, z] = p;

     return (x * x) / a2 + (y * y) / b2 + (z * z) / c2;
  };
}

export function densityFn1(idx: vec3) {
  //(3x)4 + (3y)4 + (3z)4 – 45x2 – 45y2 – 45z2

  const [x, y, z] = idx;

  const threeX = 3 * x;
  const threeY = 3 * y;
  const threeZ = 3 * z;

  const fourtyFiveX = 45 * x;
  const fourtyFiveY = 45 * x;
  const fourtyFiveZ = 45 * x;

  return (
    threeX * threeX * threeX * threeX +
    threeY * threeY * threeY * threeY +
    threeZ * threeZ * threeZ * threeZ +
    fourtyFiveX * fourtyFiveX +
    fourtyFiveY * fourtyFiveY +
    fourtyFiveZ * fourtyFiveZ
  );
}

export function createNoise3DDensityFn({
  seed,
  scale,
  octaves,
  persistence,
  lacunarity,
  offset,
}: {
  seed: number;
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  offset: { x: number; y: number; z: number };
}): DensityFn {
  if (scale <= 0) {
    scale = 0.0001;
  }

  const simplex = new SimplexNoise(seed);
  const pnrg = PNRG(seed);
  const octaveOffsets: vec3[] = [];
  for (let i = 0; i < octaves; ++i) {
    octaveOffsets.push([
      lerp(-10000, 10000, pnrg.next()) + offset.x,
      lerp(-10000, 10000, pnrg.next()) + offset.y,
      lerp(-10000, 10000, pnrg.next()) + offset.z,
    ]);
  }

  let sampleX: number;
  let sampleY: number;
  let sampleZ: number;

  let amplitude: number;
  let frequency: number;
  let value: number;

  // TODO: we may need to cache values here

  return function noise3DDensityFn(idx: vec3) {
    amplitude = 1;
    frequency = 1;
    value = 0;

    for (let i = 0; i < octaves; ++i) {
      sampleX = (idx[0] / scale) * frequency + octaveOffsets[i][0];
      sampleY = (idx[1] / scale) * frequency + octaveOffsets[i][1];
      sampleZ = (idx[2] / scale) * frequency + octaveOffsets[i][2];
      value += simplex.noise3D(sampleX, sampleY, sampleZ) * amplitude;

      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value;
  };
}

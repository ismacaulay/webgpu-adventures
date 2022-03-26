import SimplexNoise from 'simplex-noise';
import PNRG from 'alea';
import { lerp } from 'toolkit/math';
import type { vec3 } from 'gl-matrix';

export function generateNoiseMap({
  width,
  height,
  seed,
  scale,
  octaves,
  persistence,
  lacunarity,
  offset,
}: {
  width: number;
  height: number;
  seed: number;
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  offset: { x: number; y: number };
}) {
  if (scale <= 0) {
    scale = 0.0001;
  }

  const pnrg = PNRG(seed);
  const octaveOffsets = [];
  for (let i = 0; i < octaves; ++i) {
    octaveOffsets.push({
      x: lerp(-10000, 10000, pnrg.next()) + offset.x,
      y: lerp(-10000, 10000, pnrg.next()) + offset.y,
    });
  }

  const noiseMap = new Float64Array(width * height);
  const simplex = new SimplexNoise(seed);

  // use the half width/height to scale everything to the centre
  const halfWidth = width / 2.0;
  const halfHeight = height / 2.0;

  let sampleX: number;
  let sampleY: number;
  let amplitude: number;
  let frequency: number;
  let noiseHeight: number;
  let maxNoiseHeight = Number.NEGATIVE_INFINITY;
  let minNoiseHeight = Number.POSITIVE_INFINITY;
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      amplitude = 1;
      frequency = 1;
      noiseHeight = 0;

      for (let i = 0; i < octaves; ++i) {
        sampleX = ((x - halfWidth) / scale) * frequency + octaveOffsets[i].x;
        sampleY = ((y - halfHeight) / scale) * frequency + octaveOffsets[i].y;
        noiseHeight += simplex.noise2D(sampleX, sampleY) * amplitude;

        // TODO: explain what persistence, lacunarity, amplitude, and frequency is
        amplitude *= persistence;
        frequency *= lacunarity;
      }

      maxNoiseHeight = Math.max(maxNoiseHeight, noiseHeight);
      minNoiseHeight = Math.min(minNoiseHeight, noiseHeight);
      noiseMap[y * width + x] = noiseHeight;
    }
  }

  return { noiseMap, min: minNoiseHeight, max: maxNoiseHeight };
}

export function generateNoise3D({
  size,
  seed,
  scale,
  octaves,
  persistence,
  lacunarity,
  offset,
}: {
  size: vec3;
  seed: number;
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  offset: { x: number; y: number; z: number };
}) {
  if (scale <= 0) {
    scale = 0.0001;
  }

  const pnrg = PNRG(seed);
  const octaveOffsets = [];
  for (let i = 0; i < octaves; ++i) {
    octaveOffsets.push({
      x: lerp(-10000, 10000, pnrg.next()) + offset.x,
      y: lerp(-10000, 10000, pnrg.next()) + offset.y,
      z: lerp(-10000, 10000, pnrg.next()) + offset.z,
    });
  }

  const [sizeX, sizeY, sizeZ] = size;
  const noiseMap = new Float64Array(sizeX * sizeY * sizeZ);
  const simplex = new SimplexNoise(seed);

  // use the half width/height to scale everything to the centre
  const halfX = sizeX / 2.0;
  const halfY = sizeY / 2.0;
  const halfZ = sizeZ / 2.0;

  let sampleX: number;
  let sampleY: number;
  let sampleZ: number;
  let amplitude: number;
  let frequency: number;
  let noiseHeight: number;
  let maxNoiseHeight = Number.NEGATIVE_INFINITY;
  let minNoiseHeight = Number.POSITIVE_INFINITY;
  for (let z = 0; z < sizeZ; ++z) {
    for (let y = 0; y < sizeY; ++y) {
      for (let x = 0; x < sizeX; ++x) {
        amplitude = 1;
        frequency = 1;
        noiseHeight = 0;

        for (let i = 0; i < octaves; ++i) {
          sampleX = ((x - halfX) / scale) * frequency + octaveOffsets[i].x;
          sampleY = ((y - halfY) / scale) * frequency + octaveOffsets[i].y;
          sampleZ = ((z - halfZ) / scale) * frequency + octaveOffsets[i].z;
          noiseHeight += simplex.noise3D(sampleX, sampleY, sampleZ) * amplitude;

          amplitude *= persistence;
          frequency *= lacunarity;
        }

        maxNoiseHeight = Math.max(maxNoiseHeight, noiseHeight);
        minNoiseHeight = Math.min(minNoiseHeight, noiseHeight);
        noiseMap[z * sizeY * sizeX + y * sizeX + x] = noiseHeight;
      }
    }
  }

  return { noiseMap, min: minNoiseHeight, max: maxNoiseHeight };
}

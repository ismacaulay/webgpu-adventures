import type { vec3 } from 'gl-matrix';

export function normalizeColour(colour: vec3): vec3 {
  return [colour[0] / 255, colour[1] / 255, colour[2] / 255];
}

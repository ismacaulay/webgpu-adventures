import { glMatrix } from 'gl-matrix';

export function radians(degrees: number) {
  return glMatrix.toRadian(degrees);
}

export function inverseLerp(a: number, b: number, value: number) {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  if (max === min) {
    return 0;
  }

  return (value - min) / (max - min);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

import { vec3 } from 'gl-matrix';

type DensityFn = (x: number, y: number, z: number) => number;

export function createSphereDensityFn({
  radius,
  centre,
}: {
  radius: number;
  centre: vec3;
}): DensityFn {
  const p = vec3.create();

  let l: number;
  return function sphereDensityFn(x: number, y: number, z: number) {
    vec3.set(p, x, y, z);
    l = vec3.length(vec3.sub(p, centre, p));
    return radius - l;
  };
}

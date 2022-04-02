import type { vec3 } from 'gl-matrix';

export function pointInSphere(p: vec3, centre: vec3, radius: number) {
  const [pX, pY, pZ] = p;
  const [cX, cY, cZ] = centre;

  const dX = cX - pX;
  const dY = cY - pY;
  const dZ = cZ - pZ;

  return dX * dX + dY * dY + dZ * dZ < radius * radius;
}

export function pointInBox(p: vec3, min: vec3, max: vec3) {
  const [pX, pY, pZ] = p;

  return (
    min[0] < pX && pX < max[0] && min[1] < pY && pY < max[1] && min[2] < pZ && pZ < max[2]
  );
}

import { mat4, vec3 } from 'gl-matrix';
import type { BoundingBox } from 'toolkit/types/math';
import { ensureBoundingBoxNotFlat, getBoundingBoxCorners } from 'toolkit/math/bounding-box';

export function calculateZPlanes({
  boundingBox,
  centre,
  orientation,
  distance,
  perspective,
}: {
  boundingBox: BoundingBox;
  centre: vec3;
  orientation: mat4;
  distance: number;
  perspective: boolean;
}) {
  const corners = getBoundingBoxCorners(ensureBoundingBoxNotFlat(boundingBox));

  let zmin = Number.POSITIVE_INFINITY;
  let zmax = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < 8; ++i) {
    const corner = corners[i];
    // transform the corner to be in line with the camera centre
    vec3.sub(corner, corner, centre);

    // transform the corner to be rotated like the camera
    vec3.transformMat4(corner, corner, orientation);

    zmin = Math.min(zmin, corner[2]);
    zmax = Math.max(zmin, corner[2]);
  }

  // pad the clip planes to ensure they are not right on the bounding box
  const padding = Math.abs(zmax - zmin) * 0.1;
  zmin -= padding;
  zmax += padding;

  let znear = distance - zmax;
  let zfar = distance - znear;
  if (perspective) {
    znear = Math.max(znear, 0.1 * distance);
    zfar = Math.max(zfar, 0.1 * distance);
  }
  return { znear, zfar };
}

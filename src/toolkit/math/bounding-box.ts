import { vec3 } from 'gl-matrix';
import type { BoundingBox } from 'toolkit/types/math';

export function computeBoundingBox(array: ArrayLike<number>, offset = 0, stride = 3): BoundingBox {
  if (array.length <= 3) {
    throw new Error('[computeBoundingBox] Not enough values in array');
  }

  const min = vec3.fromValues(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );
  const max = vec3.fromValues(
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  );

  for (let i = offset; i < array.length; i += stride) {
    const x = array[i];
    const y = array[i + 1];
    const z = array[i + 2];

    if (x < min[0]) {
      min[0] = x;
    }
    if (x > max[0]) {
      max[0] = x;
    }

    if (y < min[1]) {
      min[1] = y;
    }
    if (y > max[1]) {
      max[1] = y;
    }

    if (z < min[2]) {
      min[2] = z;
    }
    if (z > max[2]) {
      max[2] = z;
    }
  }

  return { min, max };
}

export function computeBoundingBoxFromBoundingBoxes(boundingBoxes: BoundingBox[]): BoundingBox {
  if (boundingBoxes.length === 0) {
    throw new Error('[computeBoundingBoxFromBoundingBoxes] No bounding boxes given');
  }

  const min = vec3.fromValues(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );
  const max = vec3.fromValues(
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  );

  for (let i = 0; i < boundingBoxes.length; ++i) {
    const bb = boundingBoxes[i];

    if (bb.min[0] < min[0]) {
      min[0] = bb.min[0];
    }
    if (bb.max[0] > max[0]) {
      max[0] = bb.max[0];
    }

    if (bb.min[1] < min[1]) {
      min[1] = bb.min[1];
    }
    if (bb.max[1] > max[1]) {
      max[1] = bb.max[1];
    }

    if (bb.min[2] < min[2]) {
      min[2] = bb.min[2];
    }
    if (bb.max[2] > max[2]) {
      max[2] = bb.max[2];
    }
  }

  return { min, max };
}

/**
 * Corner layout:
 *  A: min, G: max
 *        H-----G
 *       /|    /|
 *    ^ E-----F |
 *    | | D---|-C  ^
 *  z | |/    |/  / y
 *    | A-----B  /
 *    O ------->
 *         x
 */
export function getBoundingBoxCorners(boundingBox: BoundingBox) {
  const { min, max } = boundingBox;
  return [
    vec3.fromValues(min[0], min[1], min[2]),
    vec3.fromValues(max[0], min[1], min[2]),
    vec3.fromValues(max[0], max[1], min[2]),
    vec3.fromValues(min[0], max[1], min[2]),

    vec3.fromValues(min[0], min[1], max[2]),
    vec3.fromValues(max[0], min[1], max[2]),
    vec3.fromValues(max[0], max[1], max[2]),
    vec3.fromValues(min[0], max[1], max[2]),
  ];
}

export function getBoundingBoxCentre(boundingBox: BoundingBox) {
  const { min, max } = boundingBox;
  return vec3.fromValues(min[0] + max[0] / 2.0, min[1] + max[1] / 2.0, min[2] + max[2] / 2.0);
}

export function ensureBoundingBoxNotFlat(boundingBox: BoundingBox) {
  const { min, max } = boundingBox;

  const size = vec3.sub(vec3.create(), max, min);
  const centre = getBoundingBoxCentre(boundingBox);

  // compute the delta as a percentage of the max size
  let delta = Math.max(size[0], Math.max(size[1], size[2])) * 0.05;
  if (delta === 0) {
    delta = 1;
  }

  // update any size by the delta if it is too small
  const result = { min: vec3.clone(min), max: vec3.clone(max) };
  const twoDelta = 2 * delta;
  if (size[0] < twoDelta) {
    result.min[0] = centre[0] - delta;
    result.max[0] = centre[0] + delta;
  }
  if (size[1] < twoDelta) {
    result.min[1] = centre[1] - delta;
    result.max[1] = centre[1] + delta;
  }
  if (size[2] < twoDelta) {
    result.min[2] = centre[2] - delta;
    result.max[2] = centre[2] + delta;
  }
  return result;
}

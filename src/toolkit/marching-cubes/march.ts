import { vec2, vec3 } from 'gl-matrix';
import type { DensityFn } from './density';
import { EDGE_LOOKUP, EDGE_TO_CORNER_LOOKUP } from './tables';

/*
 * 0: x, y, z+1
 * 1: x+1, y, z+1
 * 2: x+1, y, z
 * 3: x, y, z
 *
 * 4: x, y+1, z+1
 * 5: x+1, y+1, z+1
 * 6: x+1, y+1, z
 * 7: x, y+1, z
 */
function cornerIndex(corner: number, cubeIdx: vec3): vec3 {
  let [x, y, z] = cubeIdx;

  switch (corner) {
    case 0: {
      z = z + 1;
      break;
    }
    case 1: {
      x = x + 1;
      z = z + 1;
      break;
    }
    case 2: {
      x = x + 1;
      break;
    }
    case 3: {
      break;
    }

    case 4: {
      y = y + 1;
      z = z + 1;
      break;
    }
    case 5: {
      x = x + 1;
      y = y + 1;
      z = z + 1;
      break;
    }
    case 6: {
      x = x + 1;
      y = y + 1;
      break;
    }
    case 7: {
      y = y + 1;
      break;
    }
  }

  return [x, y, z];
}

function cornerPosition(corner: number, cubeIdx: vec3, spacing: number): vec3 {
  const [x, y, z] = cornerIndex(corner, cubeIdx);
  return [x * spacing, y * spacing, z * spacing];
}

let maxValue = Number.NEGATIVE_INFINITY;
let minValue = Number.POSITIVE_INFINITY;
export function createMarchingCubes({
  size,
  densityFn,
  isoLevel,
  spacing,
}: {
  size: vec3;
  densityFn: DensityFn;
  isoLevel: number;
  spacing: number;
}) {
  const [sizeX, sizeY, sizeZ] = size;

  function computeLookupIndex(cubeIdx: vec3) {
    let idx = 0x0;
    let value: number;

    for (let i = 0; i < 8; ++i) {
      value = densityFn(cornerPosition(i, cubeIdx, spacing));
      maxValue = Math.max(maxValue, value);
      minValue = Math.min(minValue, value);
      // console.log(value);
      if (value < isoLevel) {
        idx |= 1 << i;
      }
    }

    return idx;
  }

  function addVerticesForEdges(cubeIdx: vec3, edges: number[], vertices: number[]) {
    let edge: number;
    let corners: vec2;
    let a: vec3;
    let b: vec3;
    let t: number;
    let vA: number;
    let vB: number;
    const p = vec3.create();

    for (let i = 0; i < edges.length; ++i) {
      edge = edges[i];
      if (edge === -1) {
        continue;
      }

      corners = EDGE_TO_CORNER_LOOKUP[edge];
      a = cornerPosition(corners[0], cubeIdx, spacing);
      vA = densityFn(a);

      b = cornerPosition(corners[1], cubeIdx, spacing);
      vB = densityFn(b);

      t = (isoLevel - vA) / (vB - vA);

      vec3.lerp(p, a, b, t);
      vertices.push(p[0], p[1], p[2]);
    }
  }

  return {
    march() {
      const vertices: number[] = [];
      let edgeIdx: number;
      const cubeIdx = vec3.create();
      let edges: number[];

      // TODO: we could precompute all values for the corners so that
      //       they dont need to always be computed
      for (let z = 0; z < sizeZ; ++z) {
        for (let y = 0; y < sizeY; ++y) {
          for (let x = 0; x < sizeX; ++x) {
            if (x < sizeX - 1 && y < sizeY - 1 && z < sizeZ - 1) {
              vec3.set(cubeIdx, x, y, z);

              edgeIdx = computeLookupIndex(cubeIdx);
              edges = EDGE_LOOKUP[edgeIdx];

              addVerticesForEdges(cubeIdx, edges, vertices);
            }
          }
        }
      }

      console.log({ minValue, maxValue });

      return { vertices: Float64Array.from(vertices) };
    },
  };
}

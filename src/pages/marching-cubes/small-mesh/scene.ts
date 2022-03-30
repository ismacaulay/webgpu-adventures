import {
  createMeshGeometryComponent,
  createShaderMaterialComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import type {
  BufferManager,
  EntityManager,
  ShaderManager,
  TextureManager,
} from 'toolkit/types/ecs/managers';
import { BufferAttributeFormat, VertexBufferStepMode } from 'toolkit/types/webgpu/buffers';
import { normalizeColour } from 'toolkit/utils/colour';
import { generateSphereMesh } from 'toolkit/primitives/sphere';
import { createShader } from './instanced-sphere-shader';
import { computeBoundingBox } from 'toolkit/math/bounding-box';
import { generateNoise3D } from 'toolkit/math/noise';
import { vec2, vec3 } from 'gl-matrix';
import { inverseLerp } from 'toolkit/math';
import { EDGE_LOOKUP, EDGE_TO_CORNER_LOOKUP } from 'toolkit/marching-cubes/tables';
import { createDiffuseShader } from 'toolkit/webgpu/shaders/diffuse-shader';
import { createSphereDensityFn } from 'toolkit/marching-cubes/density';

/*
 * TODO: these are wrong
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
function cornerPosition(corner: number, cubeIdx: vec3): vec3 {
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

function computeValueIndex(corner: number, cubeIdx: vec3, size: vec3) {
  const [x, y, z] = cornerPosition(corner, cubeIdx);
  const [sX, sY] = size;
  return z * sY * sX + y * sX + x;
}

function computeLookupIndex(
  cubeIdx: vec3,
  {
    values,
    isoLevel,
    size,
  }: {
    values: Float32Array | Float64Array;
    isoLevel: number;
    size: vec3;
  },
) {
  let idx = 0x0;
  let value: number;

  for (let i = 0; i < 8; ++i) {
    value = values[computeValueIndex(i, cubeIdx, size)];
    if (value < isoLevel) {
      idx |= 1 << i;
    }
  }

  return idx;
}

function addVerticesForEdges(
  {
    cubeIdx,
    isoLevel,
    values,
    edges,
    size,
  }: {
    cubeIdx: vec3;
    isoLevel: number;
    values: Float32Array | Float64Array;
    edges: number[];
    size: vec3;
  },
  vertices: number[],
) {
  let corners: vec2;
  let a: vec3;
  let b: vec3;
  let t: number;
  let vA: number;
  let vB: number;
  const p = vec3.create();

  const filteredEdges = edges.filter((e) => e !== -1);

  if (filteredEdges.length !== 0) {
    filteredEdges.forEach((edge) => {
      corners = EDGE_TO_CORNER_LOOKUP[edge];
      a = cornerPosition(corners[0], cubeIdx);
      vA = values[computeValueIndex(corners[0], cubeIdx, size)];

      b = cornerPosition(corners[1], cubeIdx);
      vB = values[computeValueIndex(corners[1], cubeIdx, size)];

      t = (isoLevel - vA) / (vB - vA);

      vec3.lerp(p, a, b, t);
      vertices.push(p[0], p[1], p[2]);
    });
  }
}

function generateMesh({
  density,
  size,
  isoLevel,
}: {
  density: (x: number, y: number, z: number) => number;
  size: vec3;
  isoLevel: number;
}) {
  // const seed = 42;

  const [sizeX, sizeY, sizeZ] = size;
  const numPoints = sizeX * sizeY * sizeZ;

  const positions = new Float32Array(numPoints * 3);

  // const persistence = 0.5;
  // const lacunarity = 2.0;
  // const scale = 30.0;
  // const octaves = 4;

  // const offset = {
  //   x: 0,
  //   y: 0,
  //   z: 0,
  // };

  // const { noiseMap, min, max } = generateNoise3D({
  //   size,
  //   seed,
  //   scale,
  //   octaves,
  //   persistence,
  //   lacunarity,
  //   offset,
  // });

  const surfaceValues = new Float64Array(numPoints);

  let idx: number;
  let value: number;
  let max = Number.NEGATIVE_INFINITY;
  let min = Number.POSITIVE_INFINITY;
  for (let z = 0; z < sizeZ; ++z) {
    for (let y = 0; y < sizeY; ++y) {
      for (let x = 0; x < sizeX; ++x) {
        idx = z * sizeY * sizeX + y * sizeX + x;
        value = density(x, y, z);

        surfaceValues[idx] = value;
        max = Math.max(max, value);
        min = Math.min(min, value);
      }
    }
  }

  const vertices: number[] = [];

  const dataValues = new Float64Array(numPoints);
  let edgeIdx: number;
  let edges: number[];
  const cubeIdx: vec3 = vec3.create();
  for (let z = 0; z < sizeZ; ++z) {
    for (let y = 0; y < sizeY; ++y) {
      for (let x = 0; x < sizeX; ++x) {
        idx = z * sizeY * sizeX + y * sizeX + x;
        positions[idx * 3 + 0] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;

        dataValues[idx] = inverseLerp(min, max, surfaceValues[idx]);

        if (x < sizeX - 1 && y < sizeY - 1 && z < sizeZ - 1) {
          vec3.set(cubeIdx, x, y, z);
          edgeIdx = computeLookupIndex(cubeIdx, {
            values: surfaceValues,
            isoLevel,
            size,
          });
          edges = EDGE_LOOKUP[edgeIdx];
          addVerticesForEdges({ cubeIdx, edges, values: surfaceValues, isoLevel, size }, vertices);
        }
      }
    }
  }

  return {
    vertices: Float32Array.from(vertices),
    numPoints,
    noiseMap: surfaceValues,
    values: dataValues,
    positions,
  };
}

export async function buildScene(
  {
    entityManager,
    bufferManager,
    shaderManager,
    textureManager,
  }: {
    entityManager: EntityManager;
    bufferManager: BufferManager;
    shaderManager: ShaderManager;
    textureManager: TextureManager;
  },
  params: { groundLevel: number },
) {
  const size: vec3 = [10, 10, 10];

  const centre = vec3.create();

  const radius = 4;
  const isoLevel = 0;
  vec3.scale(centre, vec3.sub(centre, size, [1, 1, 1]), 0.5);

  const sphereDensityFn = createSphereDensityFn({
    radius,
    centre,
  });

  const {
    vertices: meshVerts,
    numPoints,
    noiseMap,
    values,
    positions,
  } = generateMesh({
    density: sphereDensityFn,
    size,
    isoLevel,
  });
  const boundingBox = computeBoundingBox(positions);

  /*
   * create mesh
   */
  const meshEntity = entityManager.create();
  entityManager.addComponent(meshEntity, createTransformComponent({}));

  entityManager.addComponent(
    meshEntity,
    createMeshGeometryComponent({
      count: meshVerts.length / 3,
      buffers: [
        {
          array: meshVerts,
          attributes: [
            {
              location: 0,
              format: BufferAttributeFormat.Float32x3,
            },
          ],
        },
      ],
    }),
  );
  const meshShaderId = createDiffuseShader(
    { shaderManager, bufferManager },
    [
      { position: [0.33, 0.25, 0.9], intensity: 0.75 },
      { position: [-0.55, -0.25, -0.79], intensity: 0.75 },
    ],
    { colour: normalizeColour([164, 35, 207]) },
  );
  entityManager.addComponent(
    meshEntity,
    createShaderMaterialComponent({
      shader: meshShaderId,
    }),
  );

  /*
   * create spheres
   */
  const sphereEntity = entityManager.create();
  entityManager.addComponent(sphereEntity, createTransformComponent({}));

  const { vertices } = generateSphereMesh(0.05, 32, 32);
  entityManager.addComponent(
    sphereEntity,
    createMeshGeometryComponent({
      count: vertices.length / 3,
      instances: numPoints,
      buffers: [
        {
          array: vertices,
          attributes: [
            {
              location: 0,
              format: BufferAttributeFormat.Float32x3,
            },
          ],
        },
        {
          array: positions,
          stepMode: VertexBufferStepMode.Instance,
          attributes: [
            {
              location: 1,
              format: BufferAttributeFormat.Float32x3,
            },
          ],
        },
        {
          array: noiseMap,
          stepMode: VertexBufferStepMode.Instance,
          attributes: [
            {
              location: 2,
              format: BufferAttributeFormat.Float32,
            },
          ],
        },
        {
          array: values,
          stepMode: VertexBufferStepMode.Instance,
          attributes: [
            {
              location: 3,
              format: BufferAttributeFormat.Float32,
            },
          ],
        },
      ],
    }),
  );

  const shaderId = await createShader(
    { shaderManager, bufferManager, textureManager },
    [
      { position: [0.33, 0.25, 0.9], intensity: 0.75 },
      { position: [-0.55, -0.25, -0.79], intensity: 0.75 },
    ],
    { isoLevel: 0 },
    { colour: normalizeColour([164, 35, 207]) },
  );
  entityManager.addComponent(
    sphereEntity,
    createShaderMaterialComponent({
      shader: shaderId,
    }),
  );

  return { boundingBox, entity: sphereEntity, shaderId };
}

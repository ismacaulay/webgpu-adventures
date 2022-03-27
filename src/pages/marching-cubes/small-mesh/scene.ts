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

/*
 * 0: x+1, y, z+1
 * 1: x+1, y, z
 * 2: x, y, z
 * 3: x, y, z+1
 *
 * 4: x+1, y+1, z+1
 * 5: x+1, y+1, z
 * 6: x, y+1, z
 * 7: x, y+1, z+1
 */
function cornerPosition(corner: number, cubeIdx: vec3): vec3 {
  let [x, y, z] = cubeIdx;

  switch (corner) {
    case 0: {
      x = x + 1;
      z = z + 1;
      break;
    }
    case 1: {
      x = x + 1;
      break;
    }
    case 2: {
      break;
    }
    case 3: {
      z = z + 1;
      break;
    }

    case 4: {
      x = x + 1;
      y = y + 1;
      z = z + 1;
      break;
    }
    case 5: {
      x = x + 1;
      y = y + 1;
      break;
    }
    case 6: {
      y = y + 1;
      break;
    }
    case 7: {
      y = y + 1;
      z = z + 1;
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
    groundLevel,
    size,
  }: {
    values: Float32Array | Float64Array;
    groundLevel: number;
    size: vec3;
  },
) {
  let idx = 0x0;

  for (let i = 0; i < 8; ++i) {
    const value = values[computeValueIndex(i, cubeIdx, size)];
    if (value >= groundLevel) {
      idx |= 1 << i;
    }
  }

  return idx;
}

function addVerticesForEdges(cubeIdx: vec3, edges: number[], vertices: number[]) {
  let corners: vec2;
  let a: vec3;
  let b: vec3;
  const p = vec3.create();
  edges.forEach((edge) => {
    if (edge !== -1) {
      corners = EDGE_TO_CORNER_LOOKUP[edge];
      a = cornerPosition(corners[0], cubeIdx);
      b = cornerPosition(corners[1], cubeIdx);
      vec3.lerp(p, a, b, 0.5);
      vertices.push(p[0], p[1], p[2]);
    }
  });
}

function generateMesh({ size, groundLevel }: { size: vec3; groundLevel: number }) {
  const seed = 42;

  const [sizeX, sizeY, sizeZ] = size;
  const numPoints = sizeX * sizeY * sizeZ;

  const positions = new Float32Array(numPoints * 3);

  const persistence = 0.5;
  const lacunarity = 2.0;
  const scale = 30.0;
  const octaves = 4;

  const offset = {
    x: 0,
    y: 0,
    z: 0,
  };

  const { noiseMap, min, max } = generateNoise3D({
    size,
    seed,
    scale,
    octaves,
    persistence,
    lacunarity,
    offset,
  });
  const values = noiseMap.map((v) => inverseLerp(min, max, v));

  const vertices: number[] = [];

  let idx = 0;
  let edgeIdx: number;
  let edges: number[];
  let cubeIdx: vec3 = [0, 0, 0];
  for (let z = 0; z < sizeZ; ++z) {
    for (let y = 0; y < sizeY; ++y) {
      for (let x = 0; x < sizeX; ++x) {
        idx = z * sizeY * sizeX + y * sizeX + x;
        positions[idx * 3 + 0] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;

        if (x < sizeX - 1 && y < sizeY - 1 && z < sizeZ - 1) {
          cubeIdx = [x, y, z];
          edgeIdx = computeLookupIndex(cubeIdx, { values: noiseMap, groundLevel, size });
          edges = EDGE_LOOKUP[edgeIdx];
          addVerticesForEdges(cubeIdx, edges, vertices);
        }
      }
    }
  }

  return { vertices: Float32Array.from(vertices), numPoints, noiseMap, values, positions };
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
  const {
    vertices: meshVerts,
    numPoints,
    noiseMap,
    values,
    positions,
  } = generateMesh({
    size,
    groundLevel: params.groundLevel,
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
    params,
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

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
import type { vec3 } from 'gl-matrix';
import { inverseLerp } from 'toolkit/math';

function generateMesh(size: vec3) {
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

  let idx = 0;
  for (let z = 0; z < sizeZ; ++z) {
    for (let y = 0; y < sizeY; ++y) {
      for (let x = 0; x < sizeX; ++x) {
        idx = z * sizeY * sizeX + y * sizeX + x;
        positions[idx * 3 + 0] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;
      }
    }
  }

  return { numPoints, noiseMap, values, positions };
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
  const entity = entityManager.create();

  entityManager.addComponent(entity, createTransformComponent({}));

  const size: vec3 = [10, 10, 10];
  const { numPoints, noiseMap, values, positions } = generateMesh(size);
  const boundingBox = computeBoundingBox(positions);

  const { vertices } = generateSphereMesh(0.05, 32, 32);
  entityManager.addComponent(
    entity,
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
    entity,
    createShaderMaterialComponent({
      shader: shaderId,
    }),
  );

  return { boundingBox, entity, shaderId };
}

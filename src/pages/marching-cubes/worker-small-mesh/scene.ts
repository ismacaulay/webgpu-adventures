import type { vec3 } from 'gl-matrix';
import {
  createMeshGeometryComponent,
  createShaderMaterialComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import type { BufferManager, EntityManager, ShaderManager } from 'toolkit/types/ecs/managers';
import { BufferAttributeFormat } from 'toolkit/types/webgpu/buffers';
import { normalizeColour } from 'toolkit/utils/colour';
import { createDiffuseShader } from 'toolkit/webgpu/shaders/diffuse-shader';
import { createWorkerPool } from 'toolkit/workers/pool';

export async function buildScene({
  entityManager,
  bufferManager,
  shaderManager,
}: {
  entityManager: EntityManager;
  bufferManager: BufferManager;
  shaderManager: ShaderManager;
}) {
  const script = '/build/workers/marching-cubes.worker.js';

  const maxWorkers = navigator.hardwareConcurrency ?? 4;
  console.log('Using workers:', maxWorkers);

  const pool = createWorkerPool(script, { maxWorkers });

  const chunkSize: vec3 = [100, 100, 100];
  const numChunks: vec3 = [2, 2, 2];
  const pointSpacing = 0.1;

  const promises = [];

  const shaderId = createDiffuseShader(
    { shaderManager, bufferManager },
    [
      { position: [0.33, 0.25, 0.9], intensity: 0.75 },
      { position: [-0.55, -0.25, -0.79], intensity: 0.75 },
    ],
    { colour: normalizeColour([164, 35, 207]) },
  );
  let message: any;
  let vertexCount = 0;

  const noise = {
    seed: 42,
    scale: 10,
    octaves: 8,
    persistence: 0.2,
    lacunarity: 2.0,
    offset: { x: 0, y: 0, z: 0 },
  };
  const box = {
    min: [pointSpacing, pointSpacing, pointSpacing],
    max: [
      chunkSize[0] * numChunks[0] * pointSpacing - pointSpacing,
      chunkSize[1] * numChunks[1] * pointSpacing - pointSpacing,
      chunkSize[2] * numChunks[2] * pointSpacing - pointSpacing,
    ],
  };

  for (let z = 0; z < numChunks[2]; ++z) {
    for (let y = 0; y < numChunks[1]; ++y) {
      for (let x = 0; x < numChunks[0]; ++x) {
        message = {
          chunk: [x, y, z],

          chunkSize,
          pointSpacing,

          noise,
          box,
        };

        promises.push(
          pool.enqueue(message).then((result: { vertices: Float64Array }) => {
            const { vertices } = result;
            if (vertices.length === 0) {
              return;
            }

            // console.log(chunk, ': ', vertices.length / 3);
            vertexCount += vertices.length / 3;
            const entity = entityManager.create();
            entityManager.addComponent(entity, createTransformComponent({}));

            entityManager.addComponent(
              entity,
              createMeshGeometryComponent({
                count: vertices.length / 3,
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
                ],
              }),
            );
            entityManager.addComponent(
              entity,
              createShaderMaterialComponent({
                shader: shaderId,
              }),
            );
          }),
        );
      }
    }
  }

  await Promise.all(promises);
  pool.destroy();
  console.log('total vertices:', vertexCount);
}

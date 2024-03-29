import { vec3 } from 'gl-matrix';
import {
  createMeshGeometryComponent,
  createShaderMaterialComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import { CameraController, CameraType, OrthographicCamera } from 'toolkit/types/camera';
import type { BufferManager, EntityManager, ShaderManager } from 'toolkit/types/ecs/managers';
import { BufferAttributeFormat } from 'toolkit/types/webgpu/buffers';
import { normalizeColour } from 'toolkit/utils/colour';
import { createDiffuseShader } from 'toolkit/webgpu/shaders/diffuse-shader';
import { createWorkerPool } from 'toolkit/workers/pool';

export enum DensityFnType {
  Noise = 'noise',
  Sphere = 'sphere',
  Ellipse = 'ellipse',
}

export async function buildScene(
  {
    entityManager,
    bufferManager,
    shaderManager,
    cameraController,
  }: {
    entityManager: EntityManager;
    bufferManager: BufferManager;
    shaderManager: ShaderManager;
    cameraController: CameraController;
  },
  params: any,
) {
  const script = '/build/workers/marching-cubes.worker.js';

  const maxWorkers = navigator.hardwareConcurrency ?? 4;
  console.log('Using workers:', maxWorkers);

  const pool = createWorkerPool(script, { maxWorkers });

  const chunkSize: vec3 = [100, 100, 100];
  const numChunks: vec3 = [4, 4, 4];
  const pointSpacing = 0.1;

  cameraController.activeCamera = CameraType.Orthographic;
  const camera = cameraController.camera as OrthographicCamera;
  camera.zoom = 0.25;
  const centre: vec3 = [
    (chunkSize[0] * numChunks[0] * pointSpacing) / 2,
    (chunkSize[1] * numChunks[1] * pointSpacing) / 2,
    (chunkSize[2] * numChunks[2] * pointSpacing) / 2,
  ];

  vec3.copy(camera.target, centre);
  vec3.set(camera.position, centre[0], centre[1], 0);
  camera.updateViewMatrix();

  const promises = [];

  const shaderId = createDiffuseShader(
    { shaderManager, bufferManager },
    [
      { position: [0.33, 0.25, 0.9], intensity: 0.75 },
      { position: [-0.55, -0.25, -0.79], intensity: 0.75 },
    ],
    { colour: normalizeColour([164, 35, 207]) },
  );
  let vertexCount = 0;

  let message = {};
  let baseMessage = {};
  if (params.densityFn === DensityFnType.Noise) {
    baseMessage = {
      chunkSize,
      pointSpacing,
      isoLevel: 0,

      densityFn: params.densityFn,
      noise: params.noise,
      box: {
        min: [pointSpacing, pointSpacing, pointSpacing],
        max: [
          chunkSize[0] * numChunks[0] * pointSpacing - pointSpacing,
          chunkSize[1] * numChunks[1] * pointSpacing - pointSpacing,
          chunkSize[2] * numChunks[2] * pointSpacing - pointSpacing,
        ],
      },
    };
  } else if (params.densityFn === DensityFnType.Sphere) {
    baseMessage = {
      chunkSize,
      pointSpacing,
      isoLevel: 0,

      densityFn: params.densityFn,
      sphere: params.sphere,
    };
  } else if (params.densityFn === DensityFnType.Ellipse) {
    baseMessage = {
      chunkSize,
      pointSpacing,
      isoLevel: 1,

      densityFn: params.densityFn,
      ellipse: params.ellipse,
    };
  }

  const start = performance.now();

  const entities: number[] = [];
  for (let z = 0; z < numChunks[2]; ++z) {
    for (let y = 0; y < numChunks[1]; ++y) {
      for (let x = 0; x < numChunks[0]; ++x) {
        message = {
          chunk: [x, y, z],

          ...baseMessage,
        };

        promises.push(
          pool.enqueue(message).then((result: { vertices: Float64Array }) => {
            const { vertices } = result;
            if (vertices.length === 0) {
              return;
            }

            vertexCount += vertices.length / 3;
            const entity = entityManager.create();
            entities.push(entity);
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
  const ellapsedTime = performance.now() - start;

  pool.destroy();
  return { shaderId, vertexCount, ellapsedTime };
}

import {
  createBasicMaterialComponent,
  createMeshGeometryComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import type { BasicObjectDescriptor, Managers } from 'toolkit/types/scenes';
import { BufferAttributeFormat } from 'toolkit/types/webgpu/buffers';
import { createBasicShader } from 'toolkit/webgpu/shaders/basic-shader';

export function generateCube(managers: Managers, overrides?: BasicObjectDescriptor) {
  const { entityManager, bufferManager, shaderManager } = managers;

  const entity = entityManager.create();

  entityManager.addComponent(entity, createTransformComponent(overrides?.transform || {}));

  entityManager.addComponent(
    entity,
    createMeshGeometryComponent({
      count: 36,
      buffers: [
        {
          // prettier-ignore
          array: Float32Array.from([
            // position
            -0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
             0.5,  0.5, -0.5,
             0.5,  0.5, -0.5,
            -0.5,  0.5, -0.5,
            -0.5, -0.5, -0.5,

            -0.5, -0.5,  0.5,
             0.5, -0.5,  0.5,
             0.5,  0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5,  0.5,  0.5,
            -0.5, -0.5,  0.5,

            -0.5,  0.5,  0.5,
            -0.5,  0.5, -0.5,
            -0.5, -0.5, -0.5,
            -0.5, -0.5, -0.5,
            -0.5, -0.5,  0.5,
            -0.5,  0.5,  0.5,

             0.5,  0.5,  0.5,
             0.5,  0.5, -0.5,
             0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
             0.5, -0.5,  0.5,
             0.5,  0.5,  0.5,

            -0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
             0.5, -0.5,  0.5,
             0.5, -0.5,  0.5,
            -0.5, -0.5,  0.5,
            -0.5, -0.5, -0.5,

            -0.5,  0.5, -0.5,
             0.5,  0.5, -0.5,
             0.5,  0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5,  0.5,  0.5,
            -0.5,  0.5, -0.5,
          ]),
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
    createBasicMaterialComponent({
      shader: createBasicShader({ bufferManager, shaderManager }),
      ...(overrides?.material || {}),
    }),
  );

  return entity;
}

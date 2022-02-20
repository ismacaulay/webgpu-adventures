import type { vec3 } from 'gl-matrix';
import {
  createBasicMaterialComponent,
  createMeshGeometryComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import { Colours } from 'toolkit/materials';
import type { BufferManager, EntityManager, ShaderManager } from 'toolkit/types/ecs/managers';
import { BufferAttributeFormat } from 'toolkit/types/webgpu/buffers';
import { createBasicShader } from 'toolkit/webgpu/shaders/basic-shader';
import { CUBE_VERTICES } from 'utils/cube-vertices';

export function createLightObject(
  {
    entityManager,
    shaderManager,
    bufferManager,
  }: {
    entityManager: EntityManager;
    shaderManager: ShaderManager;
    bufferManager: BufferManager;
  },
  transform: { translation: vec3; scale?: vec3 },
) {
  const entity = entityManager.create();
  entityManager.addComponent(
    entity,
    createTransformComponent({
      translation: transform.translation,
      scale: transform.scale ?? [0.1, 0.1, 0.1],
    }),
  );

  entityManager.addComponent(
    entity,
    createBasicMaterialComponent({
      shader: createBasicShader({ shaderManager, bufferManager }),
      colour: Colours.White,
    }),
  );
  entityManager.addComponent(
    entity,
    createMeshGeometryComponent({
      count: 36,
      buffers: [
        {
          array: CUBE_VERTICES,
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
  return entity;
}

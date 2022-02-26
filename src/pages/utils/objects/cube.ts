import type { vec3 } from 'gl-matrix';
import {
  createBasicMaterialComponent,
  createMeshGeometryComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import type { Colour3 } from 'toolkit/types/colour';
import type { BufferManager, EntityManager, ShaderManager } from 'toolkit/types/ecs/managers';
import { BufferAttributeFormat } from 'toolkit/types/webgpu/buffers';
import { createBasicShader } from 'toolkit/webgpu/shaders/basic-shader';
import { CUBE_VERTICES } from '../cube-vertices';

export function generateCube(
  managers: {
    entityManager: EntityManager;
    bufferManager: BufferManager;
    shaderManager: ShaderManager;
  },
  overrides?: {
    transform?: {
      translation?: vec3;
      rotation?: { angle: number; axis: vec3 };
      scale?: vec3;
    };
    material?: {
      colour?: Colour3;
      opacity?: number;
    };
  },
) {
  const { entityManager, bufferManager, shaderManager } = managers;

  const entity = entityManager.create();

  entityManager.addComponent(entity, createTransformComponent(overrides?.transform || {}));

  const vertexBufferDescriptor = {
    array: CUBE_VERTICES,
    attributes: [
      {
        location: 0,
        format: BufferAttributeFormat.Float32x3,
      },
    ],
  };
  const cubeVertexBufferId = bufferManager.createVertexBuffer(vertexBufferDescriptor);
  entityManager.addComponent(
    entity,
    createMeshGeometryComponent({
      count: 36,
      buffers: [
        {
          id: cubeVertexBufferId,
          ...vertexBufferDescriptor,
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

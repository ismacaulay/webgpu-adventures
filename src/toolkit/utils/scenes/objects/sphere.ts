import {
  createBasicMaterialComponent,
  createMeshGeometryComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import type { Managers, SphereObjectDescriptor } from 'toolkit/types/scenes';
import { BufferAttributeFormat } from 'toolkit/types/webgpu/buffers';
import { createBasicShader } from 'toolkit/webgpu/shaders/basic-shader';

function flattenVertices(indices: ArrayLike<number>, vertices: ArrayLike<number>) {
  const out = new Float32Array(indices.length * 3);
  let idx = 0;
  for (let i = 0; i < indices.length; ++i) {
    idx = indices[i];
    out[i * 3 + 0] = vertices[idx * 3 + 0];
    out[i * 3 + 1] = vertices[idx * 3 + 1];
    out[i * 3 + 2] = vertices[idx * 3 + 2];
  }

  return out;
}

function generateSphereMesh(radius: number, sectors: number, stacks: number) {
  const vertices: number[] = [];

  const sectorStep = (2 * Math.PI) / sectors;
  const stackStep = Math.PI / stacks;

  let stackAngle: number;
  let sectorAngle: number;
  let x: number;
  let y: number;
  let z: number;
  let xz: number;
  for (let i = 0; i <= stacks; ++i) {
    stackAngle = Math.PI / 2 - i * stackStep;
    xz = radius * Math.cos(stackAngle);
    y = radius * Math.sin(stackAngle);

    for (let j = 0; j <= sectors; ++j) {
      sectorAngle = j * sectorStep;

      x = xz * Math.cos(sectorAngle);
      z = xz * Math.sin(sectorAngle);

      vertices.push(x, y, z);
    }
  }

  const indices: number[] = [];
  let k1: number;
  let k2: number;
  for (let i = 0; i < stacks; ++i) {
    k1 = i * (sectors + 1);
    k2 = k1 + sectors + 1;
    for (let j = 0; j < sectors; ++j, ++k1, ++k2) {
      if (i !== 0) {
        indices.push(k1, k2, k1 + 1);
      }

      if (i !== stacks - 1) {
        indices.push(k1 + 1, k2, k2 + 1);
      }
    }
  }

  return { vertices: flattenVertices(indices, vertices) };
}

export function generateSphere(managers: Managers, overrides?: SphereObjectDescriptor) {
  const { entityManager, bufferManager, shaderManager } = managers;

  const entity = entityManager.create();

  entityManager.addComponent(entity, createTransformComponent(overrides?.transform || {}));

  const { radius = 1.0, stacks = 16, sectors = 32 } = overrides || {};
  const { vertices } = generateSphereMesh(radius, sectors, stacks);

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
    createBasicMaterialComponent({
      shader: createBasicShader({ bufferManager, shaderManager }),
      ...(overrides?.material || {}),
    }),
  );

  return entity;
}

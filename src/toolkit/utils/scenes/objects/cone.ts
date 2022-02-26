import {
  createBasicMaterialComponent,
  createMeshGeometryComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import type { ConeObjectDescriptor, Managers, SphereObjectDescriptor } from 'toolkit/types/scenes';
import { BufferAttributeFormat } from 'toolkit/types/webgpu/buffers';
import { flattenVertices } from 'toolkit/utils/vertices';
import { createBasicShader } from 'toolkit/webgpu/shaders/basic-shader';

function generateUnitCircleVertices(sectors: number) {
  const sectorStep = (2 * Math.PI) / sectors;
  let sectorAngle;

  const vertices: number[] = [];
  for (let i = 0; i <= sectors; ++i) {
    sectorAngle = i * sectorStep;

    vertices.push(Math.cos(sectorAngle), 0, Math.sin(sectorAngle));
  }

  return vertices;
}

// https://www.songho.ca/opengl/gl_cylinder.html
function generateConeMesh(topRadius: number, bottomRadius: number) {
  const sectors = 32;

  const height = 1;

  const unitVertices = generateUnitCircleVertices(sectors);
  const vertices: number[] = [];
  let ux: number;
  let uz: number;
  let h: number;
  let r: number;

  // sides
  for (let i = 0; i < 2; ++i) {
    h = -height / 2 + i * height;
    r = i % 2 == 0 ? bottomRadius : topRadius;
    for (let j = 0, k = 0; j <= sectors; ++j, k += 3) {
      ux = unitVertices[k];
      uz = unitVertices[k + 2];
      vertices.push(ux * r, h, uz * r);
    }
  }

  const baseCentreIndex = vertices.length / 3;
  const topCentreIndex = baseCentreIndex + sectors + 1;

  // caps
  for (let i = 0; i < 2; ++i) {
    h = -height / 2 + i * height;
    r = i % 2 == 0 ? bottomRadius : topRadius;

    // centre point
    vertices.push(0, h, 0);

    // if the radius is 0, then there is no point in doing the cap
    if (r !== 0) {
      for (let j = 0, k = 0; j < sectors; ++j, k += 3) {
        ux = unitVertices[k];
        uz = unitVertices[k + 2];
        vertices.push(ux * r, h, uz * r);
      }
    }
  }

  let k1 = 0;
  let k2 = sectors + 1;
  const indices: number[] = [];
  // sides
  for (let i = 0; i < sectors; ++i, ++k1, ++k2) {
    indices.push(k1, k1 + 1, k2);
    indices.push(k2, k1 + 1, k2 + 1);
  }

  // caps
  if (bottomRadius !== 0) {
    for (let i = 0, k = baseCentreIndex + 1; i < sectors; ++i, ++k) {
      if (i < sectors - 1) {
        indices.push(baseCentreIndex, k + 1, k);
      } else {
        indices.push(baseCentreIndex, baseCentreIndex + 1, k);
      }
    }
  }

  if (topRadius !== 0) {
    for (let i = 0, k = topCentreIndex + 1; i < sectors; ++i, ++k) {
      if (i < sectors - 1) {
        indices.push(topCentreIndex, k + 1, k);
      } else {
        indices.push(topCentreIndex, k, topCentreIndex + 1);
      }
    }
  }

  return { vertices: flattenVertices(indices, vertices) };
}
export function generateCone(managers: Managers, overrides?: ConeObjectDescriptor) {
  const { entityManager, bufferManager, shaderManager } = managers;

  const entity = entityManager.create();

  entityManager.addComponent(entity, createTransformComponent(overrides?.transform || {}));

  const { radius = 1.0 } = overrides || {};
  const { vertices } = generateConeMesh(0, radius);

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

import type { vec3 } from 'gl-matrix';
import {
  createMeshGeometryComponent,
  createShaderMaterialComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import { generateCylinderMesh } from 'toolkit/primitives/cylinder';
import { generateSphereMesh } from 'toolkit/primitives/sphere';
import type { BufferManager, EntityManager, ShaderManager } from 'toolkit/types/ecs/managers';
import { BufferAttributeFormat } from 'toolkit/types/webgpu/buffers';
import { normalizeColour } from 'toolkit/utils/colour';
import { createBasicShader } from 'toolkit/webgpu/shaders/basic-shader';

const CORNERS: [number, number, number][] = [
  [-10, -10, -10],
  [10, -10, -10],
  [10, 10, -10],
  [-10, 10, -10],

  [-10, -10, 10],
  [10, -10, 10],
  [10, 10, 10],
  [-10, 10, 10],
];

export function setupCorners({
  entityManager,
  shaderManager,
  bufferManager,
}: {
  entityManager: EntityManager;
  shaderManager: ShaderManager;
  bufferManager: BufferManager;
}) {
  const sphereMesh = generateSphereMesh(1, 32, 32);
  const colour: vec3 = normalizeColour([37, 116, 148]);

  for (let i = 0; i < CORNERS.length; ++i) {
    const entity = entityManager.create();

    entityManager.addComponent(
      entity,
      createTransformComponent({
        translation: CORNERS[i],
      }),
    );

    entityManager.addComponent(
      entity,
      createMeshGeometryComponent({
        count: sphereMesh.vertices.length / 3,
        buffers: [
          {
            array: sphereMesh.vertices,
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

    const sphereShaderId = createBasicShader({ shaderManager, bufferManager }, { colour });
    entityManager.addComponent(
      entity,
      createShaderMaterialComponent({
        shader: sphereShaderId,
      }),
    );
  }
}

export function setupConnectingLines({
  entityManager,
  shaderManager,
  bufferManager,
}: {
  entityManager: EntityManager;
  shaderManager: ShaderManager;
  bufferManager: BufferManager;
}) {
  const cylinder = generateCylinderMesh(0.1, 0.1);
  const translations: vec3[] = [
    [-10, -10, 0],
    [10, -10, 0],
    [10, 10, 0],
    [-10, 10, 0],

    [0, -10, -10],
    [0, -10, 10],
    [0, 10, 10],
    [0, 10, -10],

    [-10, 0, -10],
    [10, 0, -10],
    [10, 0, 10],
    [-10, 0, 10],
  ];
  const colour: vec3 = normalizeColour([191, 191, 191]);

  for (let i = 0; i < translations.length; ++i) {
    const entity = entityManager.create();

    let rotation: { angle: number; axis: vec3 } | undefined;
    if (i < 4) {
      rotation = {
        angle: Math.PI / 2,
        axis: [1, 0, 0],
      };
    } else if (i < 8) {
      rotation = {
        angle: Math.PI / 2,
        axis: [0, 0, 1],
      };
    }

    entityManager.addComponent(
      entity,
      createTransformComponent({
        scale: [1, 20, 1],
        rotation,
        translation: translations[i],
      }),
    );

    entityManager.addComponent(
      entity,
      createMeshGeometryComponent({
        count: cylinder.vertices.length / 3,
        buffers: [
          {
            array: cylinder.vertices,
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

    const shaderId = createBasicShader({ shaderManager, bufferManager }, { colour });
    entityManager.addComponent(
      entity,
      createShaderMaterialComponent({
        shader: shaderId,
      }),
    );
  }
}

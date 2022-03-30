import { vec3 } from 'gl-matrix';
import {
  createMeshGeometryComponent,
  createShaderMaterialComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import { EDGE_TO_CORNER_LOOKUP } from 'toolkit/marching-cubes/tables';
import { generateCylinderMesh } from 'toolkit/primitives/cylinder';
import { generateSphereMesh } from 'toolkit/primitives/sphere';
import type { BufferManager, EntityManager, ShaderManager } from 'toolkit/types/ecs/managers';
import type { GenericObject } from 'toolkit/types/generic';
import { BufferAttributeFormat } from 'toolkit/types/webgpu/buffers';
import { normalizeColour } from 'toolkit/utils/colour';
import { createBasicShader } from 'toolkit/webgpu/shaders/basic-shader';
import { createDiffuseShader } from 'toolkit/webgpu/shaders/diffuse-shader';

const CORNERS: [number, number, number][] = [
  [-10, -10, -10],
  [10, -10, -10],
  [10, -10, 10],
  [-10, -10, 10],

  [-10, 10, -10],
  [10, 10, -10],
  [10, 10, 10],
  [-10, 10, 10],
];

export const CORNER_IDS = [
  'corner 0',
  'corner 1',
  'corner 2',
  'corner 3',
  'corner 4',
  'corner 5',
  'corner 6',
  'corner 7',
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
  const corners: number[] = [];
  const entityToCorner: GenericObject<string> = {};

  for (let i = 0; i < CORNERS.length; ++i) {
    const entity = entityManager.create();

    corners.push(entity);
    entityToCorner[entity] = CORNER_IDS[i];

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

    const sphereShaderId = createBasicShader({ shaderManager, bufferManager }, { entity, colour });
    entityManager.addComponent(
      entity,
      createShaderMaterialComponent({
        shader: sphereShaderId,
      }),
    );
  }

  return { corners, entityToCorner };
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

export function setupSurface({
  entityManager,
  shaderManager,
  bufferManager,
}: {
  entityManager: EntityManager;
  shaderManager: ShaderManager;
  bufferManager: BufferManager;
}) {
  const entity = entityManager.create();
  entityManager.addComponent(entity, createTransformComponent({}));

  const vertices = new Float32Array(EDGE_TO_CORNER_LOOKUP.length * 3);
  const p = vec3.create();
  for (let i = 0; i < EDGE_TO_CORNER_LOOKUP.length; ++i) {
    const [a, b] = EDGE_TO_CORNER_LOOKUP[i];
    vec3.lerp(p, CORNERS[a], CORNERS[b], 0.5);

    vertices[i * 3 + 0] = p[0];
    vertices[i * 3 + 1] = p[1];
    vertices[i * 3 + 2] = p[2];
  }

  entityManager.addComponent(
    entity,
    createMeshGeometryComponent({
      indices: new Uint32Array(13),
      count: 0,
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

  const shaderId = createDiffuseShader(
    { shaderManager, bufferManager },
    [
      // { position: [0.33, 0.25, 0.9], intensity: 0.75 },
      // { position: [-0.55, -0.25, -0.79], intensity: 0.75 },
      { position: [-1, 1, -1], intensity: 0.75 },
      { position: [1, -1, 1], intensity: 0.75 },
      { position: [-1, -1, 1], intensity: 0.75 },
      { position: [1, 1, -1], intensity: 0.75 },
    ],
    { colour: normalizeColour([164, 35, 207]) },
  );
  entityManager.addComponent(
    entity,
    createShaderMaterialComponent({
      shader: shaderId,
    }),
  );

  return entity;
}

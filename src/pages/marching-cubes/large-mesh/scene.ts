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
import { vec3 } from 'gl-matrix';
import { createDiffuseShader } from 'toolkit/webgpu/shaders/diffuse-shader';
import { generateNoise3D } from 'toolkit/math/noise';
import { createMarchingCubes } from 'toolkit/marching-cubes/march';
import { createNoise3DDensityFn } from 'toolkit/marching-cubes/density';
import { computeBoundingBox } from 'toolkit/math/bounding-box';

export function buildScene({
  entityManager,
  bufferManager,
  shaderManager,
}: {
  entityManager: EntityManager;
  bufferManager: BufferManager;
  shaderManager: ShaderManager;
}) {
  const size: vec3 = [101, 101, 101];
  const spacing = 0.1;

  const centre = vec3.create();
  const isoLevel = 0.25;

  vec3.scale(centre, vec3.sub(centre, size, [1, 1, 1]), 0.5);

  const densityFn = createNoise3DDensityFn({
    seed: 42,
    scale: 10,
    octaves: 8,
    persistence: 0.5,
    lacunarity: 2.0,
    offset: { x: 0, y: 0, z: 0 },
  });

  const marchingCubes = createMarchingCubes({ size, spacing, densityFn, isoLevel });
  const { vertices: meshVerts } = marchingCubes.march();
  console.log(meshVerts);
  const boundingBox = computeBoundingBox(meshVerts);

  /*
   * create mesh
   */
  const meshEntity = entityManager.create();
  entityManager.addComponent(meshEntity, createTransformComponent({}));

  entityManager.addComponent(
    meshEntity,
    createMeshGeometryComponent({
      count: meshVerts.length / 3,
      buffers: [
        {
          array: meshVerts,
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
  const meshShaderId = createDiffuseShader(
    { shaderManager, bufferManager },
    [
      { position: [0.33, 0.25, 0.9], intensity: 0.75 },
      { position: [-0.55, -0.25, -0.79], intensity: 0.75 },
    ],
    { colour: normalizeColour([164, 35, 207]) },
  );
  entityManager.addComponent(
    meshEntity,
    createShaderMaterialComponent({
      shader: meshShaderId,
    }),
  );

  return { boundingBox };

  // /*
  //  * create spheres
  //  */
  // const sphereEntity = entityManager.create();
  // entityManager.addComponent(sphereEntity, createTransformComponent({}));

  // const { vertices } = generateSphereMesh(0.05, 32, 32);
  // entityManager.addComponent(
  //   sphereEntity,
  //   createMeshGeometryComponent({
  //     count: vertices.length / 3,
  //     instances: numPoints,
  //     buffers: [
  //       {
  //         array: vertices,
  //         attributes: [
  //           {
  //             location: 0,
  //             format: BufferAttributeFormat.Float32x3,
  //           },
  //         ],
  //       },
  //       {
  //         array: positions,
  //         stepMode: VertexBufferStepMode.Instance,
  //         attributes: [
  //           {
  //             location: 1,
  //             format: BufferAttributeFormat.Float32x3,
  //           },
  //         ],
  //       },
  //       {
  //         array: noiseMap,
  //         stepMode: VertexBufferStepMode.Instance,
  //         attributes: [
  //           {
  //             location: 2,
  //             format: BufferAttributeFormat.Float32,
  //           },
  //         ],
  //       },
  //       {
  //         array: values,
  //         stepMode: VertexBufferStepMode.Instance,
  //         attributes: [
  //           {
  //             location: 3,
  //             format: BufferAttributeFormat.Float32,
  //           },
  //         ],
  //       },
  //     ],
  //   }),
  // );

  // const shaderId = await createShader(
  //   { shaderManager, bufferManager, textureManager },
  //   [
  //     { position: [0.33, 0.25, 0.9], intensity: 0.75 },
  //     { position: [-0.55, -0.25, -0.79], intensity: 0.75 },
  //   ],
  //   { isoLevel: 0 },
  //   { colour: normalizeColour([164, 35, 207]) },
  // );
  // entityManager.addComponent(
  //   sphereEntity,
  //   createShaderMaterialComponent({
  //     shader: shaderId,
  //   }),
  // );

  // return { boundingBox, entity: sphereEntity, shaderId };
}

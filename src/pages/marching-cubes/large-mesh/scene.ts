import {
  createMeshGeometryComponent,
  createShaderMaterialComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import type {
  BufferManager,
  EntityManager,
  ShaderManager,
} from 'toolkit/types/ecs/managers';
import { BufferAttributeFormat } from 'toolkit/types/webgpu/buffers';
import { normalizeColour } from 'toolkit/utils/colour';
import { vec3 } from 'gl-matrix';
import { createDiffuseShader } from 'toolkit/webgpu/shaders/diffuse-shader';
import { createMarchingCubes } from 'toolkit/marching-cubes/march';
import { createNoise3DDensityFn } from 'toolkit/marching-cubes/density';
import { computeBoundingBox } from 'toolkit/math/bounding-box';
import { pointInBox, pointInSphere } from 'toolkit/math/point';

export function buildScene({
  entityManager,
  bufferManager,
  shaderManager,
}: {
  entityManager: EntityManager;
  bufferManager: BufferManager;
  shaderManager: ShaderManager;
}) {
  // const size: vec3 = [101, 101, 101];
  // const spacing = 0.1;

  // const size: vec3 = [201, 201, 201];
  // const spacing = 0.05;

  const size: vec3 = [401, 401, 401];
  const spacing = 0.025;

  // const size: vec3 = [11, 11, 11];
  // const spacing = 1;

  const centre = vec3.fromValues(5, 5, 5);
  const isoLevel = 0.5;

  const densityFn1 = createNoise3DDensityFn({
    seed: 42,
    scale: 10,
    octaves: 8,
    persistence: 0.5,
    lacunarity: 2.0,
    offset: { x: 0, y: 0, z: 0 },
  });

  const radius = 4.5;
  const min: vec3 = [1, 1, 1];
  const max: vec3 = [9, 9, 9];
  const densityFn = (idx: vec3) => {
    // TODO: instead of a sphere, what if it was a box?
    //
    // if (pointInSphere(idx, centre, radius)) {
    //   return densityFn1(idx);
    // }

    if (pointInBox(idx, min, max)) {
      return densityFn1(idx);
    }


//     if (pointInBox(idx, min, max) && pointInSphere(idx, centre, radius)) {
//       return densityFn1(idx);
//     }
    return isoLevel - 1;
  };

  const marchingCubes = createMarchingCubes({ size, spacing, densityFn, isoLevel });
  const { vertices: meshVerts } = marchingCubes.march();
  console.log('num vertices:', meshVerts.length / 3);
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

}

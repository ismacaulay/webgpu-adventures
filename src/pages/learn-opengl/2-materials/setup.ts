import { mat4, vec3 } from 'gl-matrix';
import {
  createMeshGeometryComponent,
  createShaderMaterialComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import { DefaultBuffers } from 'toolkit/types/ecs/managers';
import { BufferAttributeFormat, UniformType } from 'toolkit/types/webgpu/buffers';
import { ShaderBindingType } from 'toolkit/types/webgpu/shaders';
import { CUBE_VERTICES, CUBE_VERTICES_WITH_NORMALS } from 'utils/cube-vertices';
import gouraudShaderSource from './shaders/gouraud.wgsl';
import phongShaderSource from './shaders/phong.wgsl';
import lightShaderSource from './shaders/light.wgsl';
import { CommonMaterials, Materials } from 'toolkit/materials';
import type { Application } from 'pages/app';
import { createScriptComponent } from 'toolkit/ecs/components/script';

export enum Shading {
  Gouraud = 'gouraud',
  Phong = 'phong',
}

export function setup(app: Application) {
  const { entityManager, bufferManager, shaderManager, cameraController } = app;

  const camera = cameraController.camera;
  vec3.set(camera.position, 0, 0, 5);
  camera.updateViewMatrix();

  const cubeEntity = entityManager.create();
  entityManager.addComponent(cubeEntity, createTransformComponent({}));
  entityManager.addComponent(
    cubeEntity,
    createMeshGeometryComponent({
      count: 36,
      buffers: [
        {
          array: CUBE_VERTICES_WITH_NORMALS,
          attributes: [
            {
              location: 0,
              format: BufferAttributeFormat.Float32x3,
            },
            {
              location: 1,
              format: BufferAttributeFormat.Float32x3,
            },
          ],
        },
      ],
    }),
  );

  const lightPos = vec3.fromValues(1.2, 1.0, 2.0);

  const normal_matrix = mat4.create();
  mat4.transpose(normal_matrix, mat4.invert(normal_matrix, normal_matrix));

  const gouraudUBO = bufferManager.createUniformBuffer(
    {
      model: UniformType.Mat4,
      normal_matrix: UniformType.Mat4,

      object_colour: UniformType.Vec3,

      light_colour: UniformType.Vec3,
      light_pos: UniformType.Vec3,
      view_pos: UniformType.Vec3,
    },
    {
      model: mat4.create(),
      normal_matrix,

      object_colour: vec3.fromValues(1.0, 0.5, 0.31),

      light_colour: vec3.fromValues(1.0, 1.0, 1.0),
      light_pos: lightPos,
      view_pos: camera.position,
    },
  );
  const gouraudShader = shaderManager.create({
    source: gouraudShaderSource,
    vertex: {
      entryPoint: 'vertex_main',
    },
    fragment: {
      entryPoint: 'fragment_main',
    },
    bindings: [
      {
        type: ShaderBindingType.UniformBuffer,
        resource: gouraudUBO,
      },
      {
        type: ShaderBindingType.UniformBuffer,
        resource: DefaultBuffers.ViewProjection,
      },
    ],
  });

  const phongUBO = bufferManager.createUniformBuffer(
    {
      model: UniformType.Mat4,
      normal_matrix: UniformType.Mat4,

      view_pos: UniformType.Vec3,

      light_pos: UniformType.Vec3,
      light_ambient: UniformType.Vec3,
      light_diffuse: UniformType.Vec3,
      light_specular: UniformType.Vec3,

      mat_ambient: UniformType.Vec3,
      mat_diffuse: UniformType.Vec3,
      mat_specular: UniformType.Vec3,
      mat_shininess: UniformType.Scalar,
    },
    {
      model: mat4.create(),
      normal_matrix,

      view_pos: camera.position,

      light_pos: lightPos,
      light_ambient: [1.0, 1.0, 1.0],
      light_diffuse: [1.0, 1.0, 1.0],
      light_specular: [1.0, 1.0, 1.0],

      mat_ambient: [1.0, 0.5, 0.31],
      mat_diffuse: [1.0, 0.5, 0.31],
      mat_specular: [0.5, 0.5, 0.5],
      mat_shininess: 32.0,
    },
  );
  const phongShader = shaderManager.create({
    source: phongShaderSource,
    vertex: {
      entryPoint: 'vertex_main',
    },
    fragment: {
      entryPoint: 'fragment_main',
    },
    bindings: [
      {
        type: ShaderBindingType.UniformBuffer,
        resource: phongUBO,
      },
      {
        type: ShaderBindingType.UniformBuffer,
        resource: DefaultBuffers.ViewProjection,
      },
    ],
  });

  const material = createShaderMaterialComponent({
    shader: gouraudShader,
  });
  entityManager.addComponent(cubeEntity, material);
  let currentShader = shaderManager.get(gouraudShader);

  const lightEntity = entityManager.create();
  const lightTransform = createTransformComponent({
    scale: vec3.fromValues(0.2, 0.2, 0.2),
    translation: lightPos,
  });
  entityManager.addComponent(lightEntity, lightTransform);
  entityManager.addComponent(
    lightEntity,
    createMeshGeometryComponent({
      buffers: [
        {
          array: CUBE_VERTICES,
          attributes: [
            {
              format: BufferAttributeFormat.Float32x3,
              location: 0,
            },
          ],
        },
      ],
      count: 36,
    }),
  );

  const lightUniformBuffer = bufferManager.createUniformBuffer(
    {
      model: UniformType.Mat4,

      light_colour: UniformType.Vec3,
    },
    {
      model: mat4.create(),

      light_colour: vec3.fromValues(1.0, 1.0, 1.0),
    },
  );
  const lightShader = shaderManager.create({
    source: lightShaderSource,
    vertex: {
      entryPoint: 'vertex_main',
    },
    fragment: {
      entryPoint: 'fragment_main',
    },
    bindings: [
      {
        type: ShaderBindingType.UniformBuffer,
        resource: lightUniformBuffer,
      },
      {
        type: ShaderBindingType.UniformBuffer,
        resource: DefaultBuffers.ViewProjection,
      },
    ],
  });
  entityManager.addComponent(
    lightEntity,
    createShaderMaterialComponent({
      shader: lightShader,
    }),
  );

  let lightRotation = 0;
  entityManager.addComponent(
    lightEntity,
    createScriptComponent((dt: number) => {
      lightRotation += dt;
      lightRotation %= 2 * Math.PI;
      vec3.set(lightPos, 1.0 * Math.sin(lightRotation), 1.0, 1.0 * Math.cos(lightRotation));
      lightTransform.translation = lightPos;
      lightTransform.needsUpdate = true;

      currentShader.update({ light_pos: lightPos, view_pos: camera.position });
    }),
  );
  // let rafId: number;
  // let lastTime = performance.now();

  // function render() {
  //   const now = performance.now();
  //   const dt = (now - lastTime) / 1000;
  //   lastTime = now;

  //   lightRotation += dt;
  //   lightRotation %= 2 * Math.PI;
  //   vec3.set(lightPos, 1.0 * Math.sin(lightRotation), 1.0, 1.0 * Math.cos(lightRotation));
  //   // vec3.copy(lightTransform.translation, lightPos);
  //   lightTransform.translation = lightPos;
  //   lightTransform.needsUpdate = true;

  //   currentShader.update({ light_pos: lightPos, view_pos: camera.position });

  //   camera.aspect = canvas.clientWidth / canvas.clientHeight;
  //   camera.updateProjectionMatrix();

  //   cameraController.update(dt);

  //   renderSystem.update();

  //   rafId = requestAnimationFrame(render);
  // }
  // render();

  return {
    setMaterial(mat: Materials) {
      if (material.shader === phongShader) {
        const matProps = CommonMaterials[mat];
        currentShader.update({
          mat_ambient: matProps.ambient,
          mat_diffuse: matProps.diffuse,
          mat_specular: matProps.specular,
          mat_shininess: matProps.shininess,
        });
      }
    },
    setShading(shading: Shading) {
      if (shading === Shading.Gouraud) {
        material.shader = gouraudShader;
      } else {
        material.shader = phongShader;
      }
      currentShader = shaderManager.get(material.shader);
    },
  };
}

// import glslangModule from 'toolkit/webgpu/shaders/glslang';
// import { requestGPU, configureSwapChain } from 'toolkit/webgpu/utils';
// import { CUBE_VERTICES, CUBE_VERTICES_WITH_NORMALS } from 'utils/cube-vertices';
// import { createShader } from 'toolkit/webgpu/shaders/shader';
// import cubePhongVert from './shaders/lighting.vert';
// // import cubePhongFrag from './shaders/lighting.frag';
// import cubePhongMaterialFrag from './shaders/lighting-material.frag';
// // import cubeGouraudVert from './shaders/gouraud.vert';
// // import cubeGouraudFrag from './shaders/gouraud.frag';
// import lightVert from './shaders/light.vert';
// import lightFrag from './shaders/light.frag';

import { mat4, vec3 } from 'gl-matrix';
import { createCameraController } from 'toolkit/camera/camera-controller';
import {
  createBufferManager,
  createEntityManager,
  createShaderManager,
  createTextureManager,
} from 'toolkit/ecs';
import {
  createMeshGeometryComponent,
  createShaderMaterialComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import { createRenderSystem } from 'toolkit/ecs/systems';
import { CameraControls } from 'toolkit/types/camera';
import { DefaultBuffers } from 'toolkit/types/ecs/managers';
import { BufferAttributeFormat, UniformType } from 'toolkit/types/webgpu/buffers';
import { ShaderBindingType } from 'toolkit/types/webgpu/shaders';
import { createRenderer } from 'toolkit/webgpu/renderer';
import { CUBE_VERTICES, CUBE_VERTICES_WITH_NORMALS } from 'utils/cube-vertices';

import gouraudShaderSource from './shaders/gouraud.wgsl';
import phongShaderSource from './shaders/phong.wgsl';
import lightShaderSource from './shaders/light.wgsl';
import { CommonMaterials, Materials } from 'toolkit/materials';

// import { createFreeCameraController } from 'toolkit/camera/free-camera-controller';
// import { createCamera } from 'toolkit/camera/camera';
// import { createUniformBuffer } from 'toolkit/webgpu/buffers/uniform-buffer';
// import { createMeshRenderer } from 'toolkit/webgpu/meshRenderer';
// import { createVertexBuffer, BufferAttributeType, UniformType } from 'toolkit/webgpu/buffers';
// import { vec3, mat4 } from 'gl-matrix';
// import { copyBufferToBuffer } from 'toolkit/webgpu/utils';

export enum Shading {
  Gouraud = 'gouraud',
  Phong = 'phong',
}

export async function setup(canvas: HTMLCanvasElement) {
  const renderer = await createRenderer(canvas);

  // TODO: fix free controls
  const cameraController = createCameraController(canvas, { controls: CameraControls.Free });
  const camera = cameraController.camera;
  vec3.set(camera.position, 0, 0, 5);
  camera.updateViewMatrix();

  const entityManager = createEntityManager();
  const bufferManager = createBufferManager(renderer.device);
  const textureManager = createTextureManager(renderer.device);
  const shaderManager = createShaderManager(renderer.device, {
    bufferManager,
    textureManager,
  });

  const renderSystem = createRenderSystem(renderer, cameraController, {
    entityManager,
    shaderManager,
    bufferManager,
  });

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

  // const cubeFragmentUBO = createUniformBuffer(device, {
  //   // object_color: [1.0, 0.5, 0.31],

  //   // phong shading
  //   // light_color: [1.0, 1.0, 1.0],
  //   // light_pos: lightPos.value,
  //   view_pos: UniformType.Vec3,

  //   // material system
  //   material: {
  //     ambient: UniformType.Vec3,
  //     diffuse: UniformType.Vec3,
  //     specular: UniformType.Vec3,
  //     shininess: UniformType.Scalar,
  //   },
  //   light: {
  //     position: UniformType.Vec3,
  //     ambient: UniformType.Vec3,
  //     diffuse: UniformType.Vec3,
  //     specular: UniformType.Vec3,
  //   },
  // });
  // cubeFragmentUBO.updateUniforms({
  //   // object_color: [1.0, 0.5, 0.31],

  //   // phong shading
  //   // light_color: [1.0, 1.0, 1.0],
  //   // light_pos: lightPos.value,
  //   view_pos: camera.position,

  //   // material system
  //   material: {
  //     ambient: [1.0, 0.5, 0.31],
  //     diffuse: [1.0, 0.5, 0.31],
  //     specular: [0.5, 0.5, 0.5],
  //     shininess: 32.0,
  //   },
  //   light: {
  //     position: lightPos,
  //     // ambient: [0.2, 0.2, 0.2],
  //     ambient: [1.0, 1.0, 1.0],
  //     // diffuse: [0.5, 0.5, 0.5],
  //     diffuse: [1.0, 1.0, 1.0],
  //     specular: [1.0, 1.0, 1.0],
  //   },
  // });

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

  //   vec3.set(lightPos, 1.0 * Math.sin(lightRotation), 1.0, 1.0 * Math.cos(lightRotation));
  //   mat4.fromRotationTranslationScale(lightModelMatrix, [0, 0, 0, 0], lightPos, [0.2, 0.2, 0.2]);
  //   lightVertexUBO.updateUniform('model', lightModelMatrix);

  //   // gouraud shading
  //   // cubeVertexUBO.updateUniform('light_pos', lightPos.value);
  //   // cubeVertexUBO.updateUniform('view_pos', camera.position.value);
  //   // cubeVertexUBO.updateBuffer();

  //   // phong shading
  //   cubeFragmentUBO.updateUniform('light.position', lightPos);
  //   cubeFragmentUBO.updateUniform('view_pos', camera.position);

  let lightRotation = 0;
  let rafId: number;
  let lastTime = performance.now();

  function render() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    lightRotation += dt;
    lightRotation %= 2 * Math.PI;
    vec3.set(lightPos, 1.0 * Math.sin(lightRotation), 1.0, 1.0 * Math.cos(lightRotation));
    // vec3.copy(lightTransform.translation, lightPos);
    lightTransform.translation = lightPos;
    lightTransform.needsUpdate = true;

    currentShader.update({ light_pos: lightPos, view_pos: camera.position });

    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

    cameraController.update(dt);

    renderSystem.update();

    rafId = requestAnimationFrame(render);
  }
  render();

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

    destroy() {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      shaderManager.destroy();
      bufferManager.destroy();
      entityManager.destroy();

      renderer.destroy();
      cameraController.destroy();
    },
  };
}

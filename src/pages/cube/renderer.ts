import { CUBE_VERTICES_WITH_COLOR_WITH_UV } from 'pages/utils/cube-vertices';

import { mat4, vec3 } from 'gl-matrix';
import { createRenderer } from 'toolkit/webgpu/renderer';
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
import { BufferAttributeFormat, UniformType } from 'toolkit/types/webgpu/buffers';

// import shaderSource from './shader.wgsl';
import cubeSource from './cube.wgsl';
import { ShaderBindingType } from 'toolkit/types/webgpu/shaders';
import { DefaultBuffers } from 'toolkit/types/ecs/managers';

export async function createCubeRenderer(canvas: HTMLCanvasElement) {
  const renderer = await createRenderer(canvas);

  const cameraController = createCameraController(canvas);
  const camera = cameraController.camera;
  vec3.set(camera.position, 0, 0, 3);
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

  const cube = entityManager.create();
  entityManager.addComponent(cube, createTransformComponent({}));

  const vertices = CUBE_VERTICES_WITH_COLOR_WITH_UV;
  // const boundingBox = computeBoundingBox(vertices, 0, 8);
  entityManager.addComponent(
    cube,
    createMeshGeometryComponent({
      count: 36,
      buffers: [
        {
          array: CUBE_VERTICES_WITH_COLOR_WITH_UV,
          attributes: [
            {
              format: BufferAttributeFormat.Float32x3,
              location: 0,
            },
            {
              format: BufferAttributeFormat.Float32x3,
              location: 1,
            },
            {
              format: BufferAttributeFormat.Float32x2,
              location: 2,
            },
          ],
        },
      ],
      // boundingBox,
    }),
  );

  const cubeUniformBuffer = bufferManager.createUniformBuffer({
    model: UniformType.Mat4,
  });
  const cubeShader = shaderManager.create({
    source: cubeSource,
    vertex: {
      entryPoint: 'vertex_main',
    },
    fragment: {
      entryPoint: 'fragment_main',
    },
    bindings: [
      {
        type: ShaderBindingType.UniformBuffer,
        resource: cubeUniformBuffer,
      },
      {
        type: ShaderBindingType.UniformBuffer,
        resource: DefaultBuffers.ViewProjection,
      },
    ],
  });
  entityManager.addComponent(
    cube,
    createShaderMaterialComponent({
      shader: cubeShader,
    }),
  );

  let rafId: number;
  let lastTime = performance.now();

  function render() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

    cameraController.update(dt);

    renderSystem.update();

    rafId = requestAnimationFrame(render);
  }
  render();

  return {
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

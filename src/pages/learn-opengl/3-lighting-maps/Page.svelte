<script lang="ts">
  import { onMount } from 'svelte';
  import Canvas from 'components/Canvas.svelte';
  import { createApp } from 'pages/app';
  import type { Application } from 'pages/app';
  import { CameraControls } from 'toolkit/types/camera';
  import {
    createBasicMaterialComponent,
    createMeshGeometryComponent,
    createShaderMaterialComponent,
    createTransformComponent,
  } from 'toolkit/ecs/components';
  import { mat4, vec3 } from 'gl-matrix';
  import { createCircularMovementComponent } from 'toolkit/ecs/components/movement';
  import { Colours } from 'toolkit/materials';
  import { CUBE_VERTICES, CUBE_VERTICES_WITH_NORMALS_WITH_UV } from 'utils/cube-vertices';
  import { BufferAttributeFormat, UniformType } from 'toolkit/types/webgpu/buffers';
  import { createBasicShader } from 'toolkit/webgpu/shaders/basic-shader';
  import cubeShaderSource from './shader.wgsl';
  import { ShaderBindingType } from 'toolkit/types/webgpu/shaders';
  import { DefaultBuffers } from 'toolkit/types/ecs/managers';
  import { createScriptComponent } from 'toolkit/ecs/components/script';

  let canvas: any;
  onMount(() => {
    let app: Application;

    (async () => {
      const app = await createApp(canvas.getElement(), {
        camera: { controls: CameraControls.Free },
      });
      app.start();

      const { entityManager, shaderManager, bufferManager, textureManager, cameraController } = app;

      const camera = cameraController.camera;
      vec3.set(camera.position, 0, 0, 3);
      camera.updateViewMatrix();

      const lightEntity = entityManager.create();
      const lightTransform = createTransformComponent({
        translation: [1.2, 1.0, 2.0],
        scale: [0.1, 0.1, 0.1],
      });
      entityManager.addComponent(lightEntity, lightTransform);
      entityManager.addComponent(
        lightEntity,
        createCircularMovementComponent({
          center: [0, 1.0, 0.0],
          axis: [0, 1, 0],
          radius: 1,
          period: 4,
        }),
      );

      const lightShader = createBasicShader({ shaderManager, bufferManager });
      entityManager.addComponent(
        lightEntity,
        createBasicMaterialComponent({
          shader: lightShader,
          colour: Colours.White,
        }),
      );
      entityManager.addComponent(
        lightEntity,
        createMeshGeometryComponent({
          count: 36,
          buffers: [
            {
              array: CUBE_VERTICES,
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

      const cubeEntity = entityManager.create();
      entityManager.addComponent(cubeEntity, createTransformComponent({}));
      entityManager.addComponent(
        cubeEntity,
        createMeshGeometryComponent({
          count: 36,
          buffers: [
            {
              array: CUBE_VERTICES_WITH_NORMALS_WITH_UV,
              attributes: [
                {
                  location: 0,
                  format: BufferAttributeFormat.Float32x3,
                },
                {
                  location: 1,
                  format: BufferAttributeFormat.Float32x3,
                },
                {
                  location: 2,
                  format: BufferAttributeFormat.Float32x2,
                },
              ],
            },
          ],
        }),
      );

      const normal_matrix = mat4.create();
      mat4.transpose(normal_matrix, mat4.invert(normal_matrix, normal_matrix));
      const uniformBuffer = bufferManager.createUniformBuffer(
        {
          model: UniformType.Mat4,
          normal_matrix: UniformType.Mat4,

          view_pos: UniformType.Vec3,

          light_pos: UniformType.Vec3,
          light_ambient: UniformType.Vec3,
          light_diffuse: UniformType.Vec3,
          light_specular: UniformType.Vec3,

          shininess: UniformType.Scalar,
        },
        {
          model: mat4.create(),
          normal_matrix,

          view_pos: camera.position,

          light_pos: lightTransform.translation,
          light_ambient: [0.2, 0.2, 0.2],
          light_diffuse: [0.5, 0.5, 0.5],
          light_specular: [1.0, 1.0, 1.0],

          shininess: 64.0,
        },
      );
      const sampler = textureManager.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
      });
      const diffuseTextureId = await textureManager.createTexture({
        resource: { uri: '/images/container-diffuse.png' },
        format: 'rgba8unorm',
      });
      const specularTextureId = await textureManager.createTexture({
        resource: { uri: '/images/container-specular.png' },
        format: 'rgba8unorm',
      });
      const cubeShaderId = shaderManager.create({
        source: cubeShaderSource,
        vertex: {
          entryPoint: 'vertex_main',
        },
        fragment: {
          entryPoint: 'fragment_main',
        },
        bindings: [
          {
            type: ShaderBindingType.UniformBuffer,
            resource: uniformBuffer,
          },
          {
            type: ShaderBindingType.UniformBuffer,
            resource: DefaultBuffers.ViewProjection,
          },
          {
            type: ShaderBindingType.Sampler,
            resource: sampler,
          },
          {
            type: ShaderBindingType.Texture,
            resource: diffuseTextureId,
          },
          {
            type: ShaderBindingType.Texture,
            resource: specularTextureId,
          },
        ],
      });
      entityManager.addComponent(
        cubeEntity,
        createShaderMaterialComponent({
          shader: cubeShaderId,
        }),
      );

      const cubeShader = shaderManager.get(cubeShaderId);
      entityManager.addComponent(
        cubeEntity,
        createScriptComponent((dt: number) => {
          cubeShader.update({ light_pos: lightTransform.translation, view_pos: camera.position });
        }),
      );
    })();

    return () => {
      if (app) {
        app.destroy();
      }
    };
  });
</script>

<Canvas bind:this={canvas} />

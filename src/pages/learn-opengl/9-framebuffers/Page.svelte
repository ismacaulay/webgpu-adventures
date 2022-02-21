<script lang="ts">
  import { onMount } from 'svelte';
  import Stats from 'toolkit/stats';
  import Canvas from 'components/Canvas.svelte';
  import { createApp } from 'pages/app';
  import type { Application } from 'pages/app';
  import { CameraControls } from 'toolkit/types/camera';
  import { mat4, vec3 } from 'gl-matrix';
  import { CUBE_VERTICES_WITH_UV } from 'pages/utils/cube-vertices';
  import { BufferAttributeFormat, UniformType } from 'toolkit/types/webgpu/buffers';
  import {
    createMeshGeometryComponent,
    createShaderMaterialComponent,
    createTransformComponent,
  } from 'toolkit/ecs/components';
  import { ShaderBindingType } from 'toolkit/types/webgpu/shaders';
  import { DefaultBuffers } from 'toolkit/types/ecs/managers';
  import shaderSource from './shader.wgsl';
  import { Pane } from 'tweakpane';

  let container: HTMLElement;
  let canvas: any;
  onMount(() => {
    let app: Application;
    let pane: Pane;

    (async () => {
      const stats = new (Stats as any)();
      stats.showPanel(0);
      container.appendChild(stats.dom);

      pane = new Pane({ title: 'settings' });
      const params = {};

      app = await createApp(canvas.getElement(), { camera: { controls: CameraControls.Free } });
      app.onRenderBegin(() => {
        stats.begin();
      });
      app.onRenderEnd(() => {
        stats.end();
      });
      app.start();

      const { entityManager, bufferManager, shaderManager, textureManager, cameraController } = app;

      const camera = cameraController.camera;
      vec3.set(camera.position, 0, 0, 3);
      camera.updateViewMatrix();

      const sampler = textureManager.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: 'repeat',
        addressModeV: 'repeat',
      });
      const cubeTexture = await textureManager.createTexture({
        resource: { uri: '/images/container.jpg' },
        format: 'rgba8unorm',
      });
      const metalTexture = await textureManager.createTexture({
        resource: { uri: '/images/metal.png' },
        format: 'rgba8unorm',
      });

      const cubeVertexBufferDescriptor = {
        array: CUBE_VERTICES_WITH_UV,
        attributes: [
          {
            location: 0,
            format: BufferAttributeFormat.Float32x3,
          },
          {
            location: 1,
            format: BufferAttributeFormat.Float32x2,
          },
        ],
      };
      const cubeVertexBufferId = bufferManager.createVertexBuffer(cubeVertexBufferDescriptor);

      const cubePositions: vec3[] = [
        [-1.0, 0.0, -1.0],
        [2.0, 0.0, 0.0],
      ];

      const allShaders: number[] = [];
      let cubeShaderId = -1;
      for (let i = 0; i < cubePositions.length; ++i) {
        const entity = entityManager.create();
        entityManager.addComponent(
          entity,
          createTransformComponent({
            translation: cubePositions[i],
          }),
        );
        entityManager.addComponent(
          entity,
          createMeshGeometryComponent({
            count: 36,
            buffers: [
              {
                id: cubeVertexBufferId,
                ...cubeVertexBufferDescriptor,
              },
            ],
          }),
        );

        const modelBuffer = bufferManager.createUniformBuffer(
          {
            model: UniformType.Mat4,
          },
          {
            model: mat4.create(),
          },
        );
        const shaderBindings = [
          {
            type: ShaderBindingType.UniformBuffer,
            resource: DefaultBuffers.ViewProjection,
          },
          {
            type: ShaderBindingType.UniformBuffer,
            resource: modelBuffer,
          },
          {
            type: ShaderBindingType.Sampler,
            resource: sampler,
          },
          {
            type: ShaderBindingType.Texture,
            resource: cubeTexture,
          },
        ];

        if (cubeShaderId !== -1) {
          cubeShaderId = shaderManager.clone(cubeShaderId, shaderBindings);
        } else {
          cubeShaderId = shaderManager.create({
            source: shaderSource,
            vertex: {
              entryPoint: 'vertex_main',
            },
            fragment: {
              entryPoint: 'fragment_main',
            },
            bindings: shaderBindings,
          });
        }
        allShaders.push(cubeShaderId);
        entityManager.addComponent(
          entity,
          createShaderMaterialComponent({
            shader: cubeShaderId,
          }),
        );
      }

      // prettier-ignore
      const planeVertices = [
        // positions       // texture Coords (note we set these higher than 1 (together with GL_REPEAT as texture wrapping mode). this will cause the loor texture to repeat)
         5.0, -0.5,  5.0,  2.0, 0.0,
        -5.0, -0.5,  5.0,  0.0, 0.0,
        -5.0, -0.5, -5.0,  0.0, 2.0,

         5.0, -0.5,  5.0,  2.0, 0.0,
        -5.0, -0.5, -5.0,  0.0, 2.0,
         5.0, -0.5, -5.0,  2.0, 2.0
    ];

      const planeEntity = entityManager.create();
      entityManager.addComponent(planeEntity, createTransformComponent({}));
      entityManager.addComponent(
        planeEntity,
        createMeshGeometryComponent({
          count: 6,
          buffers: [
            {
              array: Float32Array.from(planeVertices),
              attributes: [
                {
                  location: 0,
                  format: BufferAttributeFormat.Float32x3,
                },
                {
                  location: 1,
                  format: BufferAttributeFormat.Float32x2,
                },
              ],
            },
          ],
        }),
      );
      const modelBuffer = bufferManager.createUniformBuffer(
        {
          model: UniformType.Mat4,
        },
        {
          model: mat4.create(),
        },
      );
      const shaderBindings = [
        {
          type: ShaderBindingType.UniformBuffer,
          resource: DefaultBuffers.ViewProjection,
        },
        {
          type: ShaderBindingType.UniformBuffer,
          resource: modelBuffer,
        },
        {
          type: ShaderBindingType.Sampler,
          resource: sampler,
        },
        {
          type: ShaderBindingType.Texture,
          resource: metalTexture,
        },
      ];

      const planeShaderId = shaderManager.clone(cubeShaderId, shaderBindings);
      allShaders.push(planeShaderId);
      entityManager.addComponent(
        planeEntity,
        createShaderMaterialComponent({
          shader: planeShaderId,
        }),
      );
    })();

    return () => {
      if (app) {
        app.destroy();
        pane.dispose();
      }
    };
  });
</script>

<style>
  .container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .stats-container {
    position: absolute;
    left: 5px;
    top: 0;
  }
</style>

<div class="container">
  <Canvas bind:this={canvas} />
  <div class="stats-container" bind:this={container} />
</div>

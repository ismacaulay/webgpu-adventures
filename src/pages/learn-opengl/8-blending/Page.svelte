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
  import transparentPlaneVertSource from './transparent-plane.vert.wgsl';
  import grassFragSource from './grass.frag.wgsl';
  import windowFragSource from './window.frag.wgsl';
  import { Pane } from 'tweakpane';
  import { ComponentType } from 'toolkit/types/ecs/components';
  import type { ShaderMaterialComponent } from 'toolkit/types/ecs/components';

  let container: HTMLElement;
  let canvas: any;
  onMount(() => {
    let app: Application;
    let pane: Pane;

    (async () => {
      const stats = new (Stats as any)();
      stats.showPanel(0);
      container.appendChild(stats.dom);

      pane = new Pane({ title: 'settings ' });
      const params = {
        texture: 'grass',
      };

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
      const marbleTexture = await textureManager.createTexture({
        resource: { uri: '/images/marble.jpg' },
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
            resource: marbleTexture,
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

      // prettier-ignore
      const transparentPlaneVerts = [
        0.0,  0.5,  0.0,  0.0,  0.0,
        0.0, -0.5,  0.0,  0.0,  1.0,
        1.0, -0.5,  0.0,  1.0,  1.0,

        0.0,  0.5,  0.0,  0.0,  0.0,
        1.0, -0.5,  0.0,  1.0,  1.0,
        1.0,  0.5,  0.0,  1.0,  0.0
      ]

      const transparentPlaneGeom = createMeshGeometryComponent({
        count: 6,
        buffers: [
          {
            array: Float32Array.from(transparentPlaneVerts),
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
      });

      const transparentPlaneSampler = textureManager.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
      });
      const grassTexture = await textureManager.createTexture({
        resource: {
          uri: '/images/grass.png',
        },
        format: 'rgba8unorm',
      });
      const windowTexture = await textureManager.createTexture({
        resource: {
          uri: '/images/blending_transparent_window.png',
        },
        format: 'rgba8unorm',
      });

      const planePositions: vec3[] = [
        [-1.5, 0.0, -0.48],
        [1.5, 0.0, 0.51],
        [0.0, 0.0, 0.7],
        [-0.3, 0.0, -2.3],
        [0.5, 0.0, -0.6],
      ];

      let grassShaderId = -1;
      let windowShaderId = -1;
      const transparentPlaneEntities: number[] = [];
      const grassShaders: number[] = [];
      const windowShaders: number[] = [];

      for (let i = 0; i < planePositions.length; ++i) {
        const entity = entityManager.create();
        transparentPlaneEntities.push(entity);

        entityManager.addComponent(
          entity,
          createTransformComponent({
            translation: planePositions[i],
          }),
        );
        entityManager.addComponent(entity, transparentPlaneGeom);
        const uniformBuffer = bufferManager.createUniformBuffer({
          model: UniformType.Mat4,
        });

        const grassBindings = [
          {
            type: ShaderBindingType.UniformBuffer,
            resource: DefaultBuffers.ViewProjection,
          },
          {
            type: ShaderBindingType.UniformBuffer,
            resource: uniformBuffer,
          },
          {
            type: ShaderBindingType.Sampler,
            resource: transparentPlaneSampler,
          },
          {
            type: ShaderBindingType.Texture,
            resource: grassTexture,
          },
        ];
        const windowBindings = [
          {
            type: ShaderBindingType.UniformBuffer,
            resource: DefaultBuffers.ViewProjection,
          },
          {
            type: ShaderBindingType.UniformBuffer,
            resource: uniformBuffer,
          },
          {
            type: ShaderBindingType.Sampler,
            resource: transparentPlaneSampler,
          },
          {
            type: ShaderBindingType.Texture,
            resource: windowTexture,
          },
        ];

        if (grassShaderId === -1) {
          grassShaderId = shaderManager.create({
            vertex: {
              source: transparentPlaneVertSource,
              entryPoint: 'main',
            },
            fragment: {
              source: grassFragSource,
              entryPoint: 'main',
            },
            bindings: grassBindings,
          });
        } else {
          grassShaderId = shaderManager.clone(grassShaderId, grassBindings);
        }

        if (windowShaderId === -1) {
          windowShaderId = shaderManager.create({
            vertex: {
              source: transparentPlaneVertSource,
              entryPoint: 'main',
            },
            fragment: {
              source: windowFragSource,
              entryPoint: 'main',
            },
            bindings: windowBindings,
          });
        } else {
          windowShaderId = shaderManager.clone(windowShaderId, windowBindings);
        }

        grassShaders.push(grassShaderId);
        windowShaders.push(windowShaderId);

        entityManager.addComponent(
          entity,
          createShaderMaterialComponent({
            shader: -1,
          }),
        );
      }

      function setTransparentPlanesShader(shaderIds: number[]) {
        transparentPlaneEntities.forEach((entityId, idx) => {
          const [material] = entityManager.get(entityId, [ComponentType.Material]) as [
            ShaderMaterialComponent,
          ];
          material.shader = shaderIds[idx];
          material.needsUpdate = true;
        });
      }

      function updateTransparentPlanesShader() {
        if (params.texture === 'grass') {
          setTransparentPlanesShader(grassShaders);
        } else {
          setTransparentPlanesShader(windowShaders);
        }
      }
      updateTransparentPlanesShader();

      pane
        .addInput(params, 'texture', {
          options: {
            grass: 'grass',
            window: 'window',
          },
        })
        .on('change', updateTransparentPlanesShader);
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

<script lang="ts">
  import { onMount } from 'svelte';

  import Canvas from '../../../components/Canvas.svelte';
  import { createApp } from 'pages/app';
  import type { Application } from 'pages/app';
  import { CameraControls } from 'toolkit/types/camera';
  import { mat4, vec3 } from 'gl-matrix';
  import {
    createMeshGeometryComponent,
    createShaderMaterialComponent,
    createTransformComponent,
  } from 'toolkit/ecs/components';
  import { ShaderBindingType } from 'toolkit/types/webgpu/shaders';
  import { DefaultBuffers } from 'toolkit/types/ecs/managers';
  import { BufferAttributeFormat, UniformType } from 'toolkit/types/webgpu/buffers';
  import { radians } from 'toolkit/math';
  import { CUBE_VERTICES_WITH_NORMALS_WITH_UV } from 'utils/cube-vertices';
  import cubeShaderSource from './shader.wgsl';
  import { createLightObject } from 'utils/objects/light';
  import { createScriptComponent } from 'toolkit/ecs/components/script';
  import Stats from 'toolkit/stats';

  let container: HTMLElement;
  let canvas: any;
  onMount(() => {
    let app: Application;

    (async () => {
      const stats = new (Stats as any)();
      stats.showPanel(0);
      container.appendChild(stats.dom);

      app = await createApp(canvas.getElement(), { camera: { controls: CameraControls.Free } });
      app.onRenderBegin(() => {
        stats.begin();
      });
      app.onRenderEnd(() => {
        stats.end();
      });
      app.start();

      const { entityManager, bufferManager, textureManager, shaderManager, cameraController } = app;

      const camera = cameraController.camera;
      vec3.set(camera.position, 0, 0, 3);
      camera.updateViewMatrix();

      const camDir = vec3.create();
      vec3.normalize(camDir, vec3.sub(camDir, camera.target, camera.position));

      const dirLights = [
        {
          direction: vec3.fromValues(-0.2, -1.0, -0.3),
          ambient: vec3.fromValues(0.05, 0.05, 0.05),
          diffuse: vec3.fromValues(0.4, 0.4, 0.4),
          specular: vec3.fromValues(0.5, 0.5, 0.5),
        },
      ];

      const pointLights = [
        {
          position: vec3.fromValues(0.7, 0.2, 2.0),
          kc: 1.0,
          kl: 0.09,
          kq: 0.032,
          ambient: vec3.fromValues(0.05, 0.05, 0.05),
          diffuse: vec3.fromValues(0.8, 0.8, 0.8),
          specular: vec3.fromValues(1.0, 1.0, 1.0),
        },
        {
          position: vec3.fromValues(2.3, -3.3, -4.0),
          kc: 1.0,
          kl: 0.09,
          kq: 0.032,
          ambient: vec3.fromValues(0.05, 0.05, 0.05),
          diffuse: vec3.fromValues(0.8, 0.8, 0.8),
          specular: vec3.fromValues(1.0, 1.0, 1.0),
        },
        {
          position: vec3.fromValues(-4.0, 2.0, -12.0),
          kc: 1.0,
          kl: 0.09,
          kq: 0.032,
          ambient: vec3.fromValues(0.05, 0.05, 0.05),
          diffuse: vec3.fromValues(0.8, 0.8, 0.8),
          specular: vec3.fromValues(1.0, 1.0, 1.0),
        },
        {
          position: vec3.fromValues(0.0, 0.0, -3.0),
          kc: 1.0,
          kl: 0.09,
          kq: 0.032,
          ambient: vec3.fromValues(0.05, 0.05, 0.05),
          diffuse: vec3.fromValues(0.8, 0.8, 0.8),
          specular: vec3.fromValues(1.0, 1.0, 1.0),
        },
      ];

      const spotLights = [
        {
          position: camera.position,
          direction: camDir,
          inner_cutoff: Math.cos(radians(12.5)),
          outer_cutoff: Math.cos(radians(15.0)),
          kc: 1.0,
          kl: 0.09,
          kq: 0.032,
          ambient: vec3.fromValues(0.0, 0.0, 0.0),
          diffuse: vec3.fromValues(1.0, 1.0, 1.0),
          specular: vec3.fromValues(1.0, 1.0, 1.0),
        },
      ];

      const materialUniforms = {
        view_pos: camera.position,

        shininess: 64,
        light_colour: {
          ambient: [0.2, 0.2, 0.2],
          diffuse: [0.5, 0.5, 0.5],
          specular: [1.0, 1.0, 1.0],
        },

        directional_lights: dirLights,
        point_lights: pointLights,
        spot_lights: spotLights,
      };
      const materialBuffer = bufferManager.createUniformBuffer(
        {
          view_pos: UniformType.Vec3,

          shininess: UniformType.Scalar,
          light_colour: {
            ambient: UniformType.Vec3,
            diffuse: UniformType.Vec3,
            specular: UniformType.Vec3,
          },

          directional_lights: [
            {
              direction: UniformType.Vec3,
              ambient: UniformType.Vec3,
              diffuse: UniformType.Vec3,
              specular: UniformType.Vec3,
            },
            dirLights.length,
          ],

          point_lights: [
            {
              position: UniformType.Vec3,
              kc: UniformType.Scalar,
              kl: UniformType.Scalar,
              kq: UniformType.Scalar,
              ambient: UniformType.Vec3,
              diffuse: UniformType.Vec3,
              specular: UniformType.Vec3,
            },
            pointLights.length,
          ],
          spot_lights: [
            {
              position: UniformType.Vec3,
              direction: UniformType.Vec3,
              inner_cutoff: UniformType.Scalar,
              outer_cutoff: UniformType.Scalar,
              kc: UniformType.Scalar,
              kl: UniformType.Scalar,
              kq: UniformType.Scalar,
              ambient: UniformType.Vec3,
              diffuse: UniformType.Vec3,
              specular: UniformType.Vec3,
            },
            spotLights.length,
          ],
        },
        materialUniforms,
      );

      // console.log(bufferManager.get<any>(materialBuffer).data);
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

      const cubeVertexBufferDescriptor = {
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
      };
      const cubeVertexBufferId = bufferManager.createVertexBuffer(cubeVertexBufferDescriptor);

      const cubePositions: vec3[] = [
        [0.0, 0.0, 0.0],
        [2.0, 5.0, -15.0],
        [-1.5, -2.2, -2.5],
        [-3.8, -2.0, -12.3],
        [2.4, -0.4, -3.5],
        [-1.7, 3.0, -7.5],
        [1.3, -2.0, -2.5],
        [1.5, 2.0, -2.5],
        [1.5, 0.2, -1.5],
        [-1.3, 1.0, -1.5],
      ];

      let cubeShaderId: number = -1;
      for (let i = 0; i < cubePositions.length; ++i) {
        const cubeEntity = entityManager.create();
        const angle = 20.0 * i;

        entityManager.addComponent(
          cubeEntity,
          createTransformComponent({
            translation: cubePositions[i],
            rotation: {
              angle: radians(angle),
              axis: [1.0, 0.3, 0.5],
            },
          }),
        );
        entityManager.addComponent(
          cubeEntity,
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
            normal_matrix: UniformType.Mat4,
          },
          {
            model: mat4.create(),
            normal_matrix: mat4.create(),
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
            type: ShaderBindingType.UniformBuffer,
            resource: materialBuffer,
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
        ];

        if (cubeShaderId !== -1) {
          cubeShaderId = shaderManager.clone(cubeShaderId, shaderBindings);
        } else {
          cubeShaderId = shaderManager.create({
            source: cubeShaderSource,
            vertex: {
              entryPoint: 'vertex_main',
            },
            fragment: {
              entryPoint: 'fragment_main',
            },
            bindings: shaderBindings,
          });
        }

        entityManager.addComponent(
          cubeEntity,
          createShaderMaterialComponent({
            shader: cubeShaderId,
          }),
        );
        entityManager.addComponent(
          cubeEntity,
          createScriptComponent(() => {
            vec3.normalize(camDir, vec3.sub(camDir, camera.target, camera.position));
            const shader = shaderManager.get(cubeShaderId);
            shader.update({
              spot_lights: [
                {
                  position: camera.position,
                  direction: camDir,
                },
              ],
            });
          }),
        );
      }

      for (let i = 0; i < pointLights.length; ++i) {
        createLightObject(
          { entityManager, bufferManager, shaderManager },
          { translation: pointLights[i].position },
        );
      }
    })();

    return () => {
      if (app) {
        app.destroy();
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

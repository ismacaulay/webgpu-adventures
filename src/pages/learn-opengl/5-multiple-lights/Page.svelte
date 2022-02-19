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

  let canvas: any;
  onMount(() => {
    let app: Application;

    (async () => {
      app = await createApp(canvas.getElement(), { camera: { controls: CameraControls.Free } });
      const { entityManager, bufferManager, textureManager, shaderManager, cameraController } = app;

      const camera = cameraController.camera;
      vec3.set(camera.position, 0, 0, 3);
      camera.updateViewMatrix();

      const camDir = vec3.create();
      vec3.normalize(camDir, vec3.sub(camDir, camera.target, camera.position));
      const materialUniforms = {
        view_pos: camera.position,

        shininess: 64,
        light_colour: {
          ambient: [0.2, 0.2, 0.2],
          diffuse: [0.5, 0.5, 0.5],
          specular: [1.0, 1.0, 1.0],
        },
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
        },
        materialUniforms,
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
        /* entityManager.addComponent( */
        /*   cubeEntity, */
        /*   createScriptComponent(() => { */
        /*     vec3.normalize(camDir, vec3.sub(camDir, camera.target, camera.position)); */
        /*     const shader = shaderManager.get(cubeShaderId); */
        /*     shader.update({ */
        /*       spot: { */
        /*         position: camera.position, */
        /*         direction: camDir, */
        /*       }, */
        /*     }); */
        /*   }), */
        /* ); */
      }
    })();

    return () => {
      if (app) {
        app.destroy();
      }
    };
  });
</script>

<Canvas bind:this={canvas} />

<script lang="ts">
  import { onMount } from 'svelte';
  import Stats from 'toolkit/stats';
  import Canvas from 'components/Canvas.svelte';
  import { createApp } from 'pages/app';
  import type { Application } from 'pages/app';
  import { CameraType } from 'toolkit/types/camera';
  import type { OrthographicCamera } from 'toolkit/types/camera';
  import {
    createMeshGeometryComponent,
    createShaderMaterialComponent,
    createTransformComponent,
  } from 'toolkit/ecs/components';
  import { BufferAttributeFormat, UniformType } from 'toolkit/types/webgpu/buffers';
  import type { IndexBufferDescriptor } from 'toolkit/types/webgpu/buffers';
  import { inverseLerp } from 'toolkit/math';
  import { ShaderBindingType } from 'toolkit/types/webgpu/shaders';
  import type { Shader } from 'toolkit/types/webgpu/shaders';
  import { DefaultBuffers } from 'toolkit/types/ecs/managers';
  import { Pane } from 'tweakpane';
  import { generateNoiseMap } from 'toolkit/math/noise';
  import { vec3, vec4 } from 'gl-matrix';
  import { computeBoundingBox, getBoundingBoxCentre } from 'toolkit/math/bounding-box';
  import { convertColourMapToBuffer, VIRIDIS } from 'toolkit/utils/colour-map';
  import { ComponentType } from 'toolkit/types/ecs/components';
  import type { MeshGeometryComponent } from 'toolkit/types/ecs/components';
  import vertSource from './shaders/terrain.vert.wgsl';
  import fragSource from './shaders/terrain.frag.wgsl';

  function fromTpVec4(v: { x: number; y: number; z: number; w: number }) {
    return vec4.fromValues(v.x, v.y, v.z, v.w);
  }

  function generateMesh(
    width: number,
    height: number,
    heightMap: Float64Array,
    heightMultiplier: number,
  ) {
    const numVertices = width * height * 3;
    const vertices = new Float64Array(numVertices);
    // there are w-1 and h-1 squares, and each square is made up of 6 indicies
    const indices = new Uint32Array((width - 1) * (height - 1) * 6);

    let triangleIdx = 0;
    let vertexIdx = 0;
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        vertices[vertexIdx * 3 + 0] = x;
        vertices[vertexIdx * 3 + 1] = heightMap[y * width + x] * heightMultiplier;
        vertices[vertexIdx * 3 + 2] = y;

        if (x < width - 1 && y < height - 1) {
          indices[triangleIdx + 0] = vertexIdx;
          indices[triangleIdx + 1] = vertexIdx + width;
          indices[triangleIdx + 2] = vertexIdx + width + 1;
          indices[triangleIdx + 3] = vertexIdx;
          indices[triangleIdx + 4] = vertexIdx + width + 1;
          indices[triangleIdx + 5] = vertexIdx + 1;
          triangleIdx += 6;
        }

        vertexIdx++;
      }
    }

    return {
      vertices,
      indices,
    };
  }

  let container: HTMLElement;
  let canvas: any;
  onMount(() => {
    let app: Application;
    let pane: Pane;

    const params = {
      seed: 42,
      scale: 86.0,
      octaves: 6,
      persistence: 0.5,
      lacunarity: 2.0,
      offset: { x: 0, y: 0 },
      // TODO: add a curve to control how different values are impacted by the multiplier
      heightMultiplier: 10,

      width: 100,
      height: 100,

      wireframe: false,
      lighting: true,
      opacity: 1.0,

      light1_enabled: true,
      light1: { x: 0.33, y: 0.25, z: 0.9, w: 0.75 },
      light2_enabled: true,
      light2: { x: -0.55, y: -0.25, z: -0.79, w: 0.75 },
    };

    (async () => {
      const stats = new (Stats as any)();
      stats.showPanel(0);
      container.appendChild(stats.dom);

      app = await createApp(canvas.getElement());
      app.onRenderBegin(() => {
        stats.begin();
      });
      app.onRenderEnd(() => {
        stats.end();
      });
      app.start();

      pane = new Pane({ title: 'application' });

      const { entityManager, bufferManager, shaderManager, textureManager, cameraController } = app;

      cameraController.activeCamera = CameraType.Orthographic;
      const camera = cameraController.camera as OrthographicCamera;
      camera.zoom = 0.02;
      vec3.set(camera.position, 4, 45, 10);

      const entity = entityManager.create();
      entityManager.addComponent(
        entity,
        createTransformComponent({
          scale: [1, 1, 1],
        }),
      );

      // prettier-ignore
      const { noiseMap, min, max } = generateNoiseMap(params)
      const noiseBuffer = noiseMap.map((v) => inverseLerp(min, max, v));
      const { vertices, indices } = generateMesh(
        params.width,
        params.height,
        noiseMap,
        params.heightMultiplier,
      );
      const boundingBox = computeBoundingBox(vertices);
      vec3.copy(camera.target, getBoundingBoxCentre(boundingBox));

      entityManager.addComponent(
        entity,
        createMeshGeometryComponent({
          count: indices.length,
          indices,
          buffers: [
            {
              array: vertices,
              attributes: [
                {
                  format: BufferAttributeFormat.Float32x3,
                  location: 0,
                },
              ],
            },
            {
              array: noiseBuffer,
              attributes: [
                {
                  format: BufferAttributeFormat.Float32,
                  location: 1,
                },
              ],
            },
          ],
        }),
      );

      const sampler = textureManager.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
      });
      const { data: colourMap, shape } = convertColourMapToBuffer(VIRIDIS);
      const textureId = await textureManager.createTexture({
        resource: {
          buffer: colourMap,
          shape,
        },
        format: 'rgba8unorm',
      });

      const vertexUniformBufferId = bufferManager.createUniformBuffer({
        model: UniformType.Mat4,
      });
      const fragmentUniformBufferId = bufferManager.createUniformBuffer(
        {
          wireframe: UniformType.Bool,
          enable_lighting: UniformType.Bool,
          opacity: UniformType.Scalar,

          light1_enabled: UniformType.Bool,
          light1: UniformType.Vec4,
          light2_enabled: UniformType.Bool,
          light2: UniformType.Vec4,
        },
        {
          wireframe: params.wireframe,
          enable_lighting: params.lighting,
          opacity: params.opacity,

          light1_enabled: true,
          light1: fromTpVec4(params.light1),
          light2_enabled: true,
          light2: fromTpVec4(params.light2),
        },
      );
      const shaderId = shaderManager.create({
        vertex: {
          source: vertSource,
          entryPoint: 'main',
        },
        fragment: {
          source: fragSource,
          entryPoint: 'main',
        },
        bindings: [
          {
            type: ShaderBindingType.UniformBuffer,
            resource: vertexUniformBufferId,
          },
          {
            type: ShaderBindingType.UniformBuffer,
            resource: DefaultBuffers.ViewProjection,
          },
          {
            type: ShaderBindingType.UniformBuffer,
            resource: fragmentUniformBufferId,
          },
          {
            type: ShaderBindingType.Sampler,
            resource: sampler,
          },
          {
            type: ShaderBindingType.Texture,
            resource: textureId,
          },
        ],
      });
      entityManager.addComponent(
        entity,
        createShaderMaterialComponent({
          shader: shaderId,
        }),
      );

      function updateGeometry() {
        const { noiseMap, min, max } = generateNoiseMap(params);
        const { vertices, indices } = generateMesh(
          params.width,
          params.height,
          noiseMap,
          params.heightMultiplier,
        );
        const [geometry] = entityManager.get(entity, [ComponentType.Geometry]) as [
          MeshGeometryComponent,
        ];
        (geometry.indices as IndexBufferDescriptor).array = indices;
        geometry.buffers[0].array = vertices;
        geometry.buffers[1].array = noiseMap.map((v) => inverseLerp(min, max, v));
        geometry.needsUpdate = true;
      }

      const noiseSettings = pane.addFolder({ title: 'noise settings' });

      noiseSettings.addInput(params, 'seed', { step: 1 }).on('change', updateGeometry);
      noiseSettings.addInput(params, 'offset').on('change', updateGeometry);
      noiseSettings.addInput(params, 'scale', { min: 0, max: 500 }).on('change', updateGeometry);
      noiseSettings
        .addInput(params, 'octaves', { min: 1, max: 8, step: 1 })
        .on('change', updateGeometry);
      noiseSettings
        .addInput(params, 'persistence', { min: 0, max: 1, step: 0.01 })
        .on('change', updateGeometry);
      noiseSettings
        .addInput(params, 'lacunarity', { min: 1, max: 10, step: 0.01 })
        .on('change', updateGeometry);
      noiseSettings.addInput(params, 'heightMultiplier', { min: 1 }).on('change', updateGeometry);

      const shader = shaderManager.get<Shader>(shaderId);
      const meshSettings = pane.addFolder({ title: 'mesh settings' });
      meshSettings.addInput(params, 'wireframe').on('change', () => {
        shader.update({ wireframe: params.wireframe });
      });
      meshSettings.addInput(params, 'lighting').on('change', () => {
        shader.update({ enable_lighting: params.lighting });
      });
      meshSettings.addInput(params, 'opacity', { min: 0, max: 1.0 }).on('change', () => {
        shader.update({ opacity: params.opacity });
      });

      const lightSettings = pane.addFolder({ title: 'light settings' });
      lightSettings.addInput(params, 'light1_enabled').on('change', () => {
        shader.update({ light1_enabled: params.light1_enabled });
      });
      lightSettings.addInput(params, 'light1').on('change', () => {
        shader.update({ light1: fromTpVec4(params.light1) });
      });
      lightSettings.addInput(params, 'light2_enabled').on('change', () => {
        shader.update({ light2_enabled: params.light2_enabled });
      });
      lightSettings.addInput(params, 'light2').on('change', () => {
        shader.update({ light2: fromTpVec4(params.light2) });
      });
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

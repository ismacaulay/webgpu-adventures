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
  import type { Colour3 } from 'toolkit/types/colour';
  import { inverseLerp, lerp } from 'toolkit/math';
  import PNRG from 'alea';
  import SimplexNoise from 'simplex-noise';
  import { ShaderBindingType } from 'toolkit/types/webgpu/shaders';
  import { DefaultBuffers } from 'toolkit/types/ecs/managers';
  import type { Texture } from 'toolkit/types/webgpu/textures';
  import { Pane } from 'tweakpane';
  import shaderSource from './shaders/noise-map.wgsl';
  import { generateNoiseMap } from 'toolkit/math/noise';

  let container: HTMLElement;
  let canvas: any;
  onMount(() => {
    let app: Application;
    let pane: Pane;

    enum DrawMode {
      Colour,
      Noise,
    }

    const colourMap: { value: number; colour: Colour3 }[] = [
      { value: 0.3, colour: [8, 27, 102] },
      { value: 0.4, colour: [32, 93, 158] },
      { value: 0.45, colour: [224, 205, 119] },
      { value: 0.5, colour: [13, 38, 11] },
      { value: 0.6, colour: [51, 30, 2] },
      { value: 0.7, colour: [56, 222, 38] },
      { value: 0.8, colour: [45, 46, 45] },
      { value: 0.9, colour: [255, 255, 255] },
      { value: 1, colour: [255, 255, 255] },
    ];

    function generateNoiseTexture({
      width,
      height,
      seed,
      scale,
      octaves,
      persistence,
      lacunarity,
      offset,
      mode,
    }: {
      width: number;
      height: number;
      seed: number;
      scale: number;
      octaves: number;
      persistence: number;
      lacunarity: number;
      offset: { x: number; y: number };
      mode: DrawMode;
    }) {
      const {
        noiseMap,
        min: minNoiseHeight,
        max: maxNoiseHeight,
      } = generateNoiseMap({
        width,
        height,
        seed,
        scale,
        octaves,
        persistence,
        lacunarity,
        offset,
      });

      // TODO: do this as a single loop over values in the noise map
      let idx: number;
      let value: number;
      const channels = 4;
      const data = new Uint8Array(width * height * channels);
      let entry: { value: number; colour: Colour3 };
      let noiseValue: number;
      for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
          idx = y * width + x;
          noiseValue = inverseLerp(minNoiseHeight, maxNoiseHeight, noiseMap[idx]);
          value = noiseValue * 255.0;

          idx *= channels;
          if (mode === DrawMode.Noise) {
            data[idx + 0] = value;
            data[idx + 1] = value;
            data[idx + 2] = value;
          } else {
            for (let i = 0; i < colourMap.length; ++i) {
              entry = colourMap[i];
              if (noiseValue <= entry.value) {
                data[idx + 0] = entry.colour[0];
                data[idx + 1] = entry.colour[1];
                data[idx + 2] = entry.colour[2];
                break;
              }
            }
          }

          data[idx + 3] = 255.0;
        }
      }

      return data;
    }

    const params = {
      seed: 42,
      scale: 30.0,
      octaves: 4,
      persistence: 0.5,
      lacunarity: 2.0,
      offset: { x: 0, y: 0 },

      width: 100,
      height: 100,

      mode: DrawMode.Noise,
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
      (cameraController.camera as OrthographicCamera).zoom = 0.02;

      const entity = entityManager.create();
      entityManager.addComponent(
        entity,
        createTransformComponent({
          scale: [100, 100, 1],
        }),
      );

      // prettier-ignore
      const positions = new Float32Array([
        -1, -1, 0, 0, 1, 
        1, -1, 0, 1, 1,
        1, 1, 0, 1, 0,
        -1, 1, 0, 0, 0,
      ]);
      entityManager.addComponent(
        entity,
        createMeshGeometryComponent({
          count: 6,
          indices: new Uint16Array([0, 1, 2, 2, 3, 0]),
          buffers: [
            {
              array: positions,
              attributes: [
                {
                  format: BufferAttributeFormat.Float32x3,
                  location: 0,
                },
                {
                  format: BufferAttributeFormat.Float32x2,
                  location: 1,
                },
              ],
            },
          ],
        }),
      );

      const sampler = textureManager.createSampler({
        magFilter: 'nearest',
        minFilter: 'nearest',
      });

      const data = generateNoiseTexture(params);
      const textureId = await textureManager.createTexture({
        resource: {
          buffer: data,
          shape: [params.width, params.height, 4],
        },
        format: 'rgba8unorm',
      });

      const uniformBuffer = bufferManager.createUniformBuffer({
        model: UniformType.Mat4,
      });
      const shader = shaderManager.create({
        source: shaderSource,
        vertex: {
          entryPoint: 'vertex_main',
        },
        fragment: {
          entryPoint: 'fragment_main',
        },
        bindings: [
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
          shader: shader,
        }),
      );

      function updateNoiseTexture() {
        const texture = textureManager.get<Texture>(textureId);
        texture.data = {
          buffer: generateNoiseTexture(params),
          shape: [params.width, params.height, 4],
        };
        texture.needsUpdate = true;
      }

      const noiseSettings = pane.addFolder({ title: 'noise settings' });
      noiseSettings
        .addInput(params, 'mode', {
          options: {
            colour: DrawMode.Colour,
            noise: DrawMode.Noise,
          },
        })
        .on('change', updateNoiseTexture);
      noiseSettings.addInput(params, 'seed', { step: 1 }).on('change', updateNoiseTexture);
      noiseSettings.addInput(params, 'offset').on('change', updateNoiseTexture);
      noiseSettings
        .addInput(params, 'scale', { min: 0, max: 500 })
        .on('change', updateNoiseTexture);
      noiseSettings
        .addInput(params, 'octaves', { min: 1, max: 8, step: 1 })
        .on('change', updateNoiseTexture);
      noiseSettings
        .addInput(params, 'persistence', { min: 0, max: 1, step: 0.01 })
        .on('change', updateNoiseTexture);
      noiseSettings
        .addInput(params, 'lacunarity', { min: 1, max: 10, step: 0.01 })
        .on('change', updateNoiseTexture);
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

<script lang="ts">
  import { onMount } from 'svelte';
  import Stats from 'toolkit/stats';
  import Canvas from 'components/Canvas.svelte';
  import { createApp } from 'pages/app';
  import type { Application } from 'pages/app';
  import { CameraControls, CameraType } from 'toolkit/types/camera';
  import type { OrthographicCamera } from 'toolkit/types/camera';
  import { Pane } from 'tweakpane';
  import {
    createMeshGeometryComponent,
    createShaderMaterialComponent,
    createTransformComponent,
  } from 'toolkit/ecs/components';
  import { generateSphereMesh } from 'toolkit/primitives/sphere';
  import { BufferAttributeFormat } from 'toolkit/types/webgpu/buffers';
  import { createBasicShader } from 'toolkit/webgpu/shaders/basic-shader';
  import type { Shader } from 'toolkit/types/webgpu/shaders';

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

      app = await createApp(canvas.getElement());
      app.onRenderBegin(() => {
        stats.begin();
      });
      app.onRenderEnd(() => {
        stats.end();
      });
      app.start();

      const {
        entityManager,
        bufferManager,
        shaderManager,
        textureManager,
        cameraController,
        renderSystem,
      } = app;

      cameraController.activeCamera = CameraType.Orthographic;
      const camera = cameraController.camera as OrthographicCamera;
      camera.zoom = 0.1

      const spherePositions: [number, number, number][] = [
        [-10, -10, -10],
        [10, -10, -10],
        [10, 10, -10],
        [-10, 10, -10],

        [-10, -10, 10],
        [10, -10, 10],
        [10, 10, 10],
        [-10, 10, 10],
      ];

      const sphereMesh = generateSphereMesh(1, 32, 32);

      // TODO: setup geometry instancing
      for (let i = 0; i < spherePositions.length; ++i) {
        const entity = entityManager.create();

        entityManager.addComponent(
          entity,
          createTransformComponent({
            translation: spherePositions[i],
          }),
        );

        entityManager.addComponent(
          entity,
          createMeshGeometryComponent({
            count: sphereMesh.vertices.length / 3,
            buffers: [
              {
                array: sphereMesh.vertices,
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

        const sphereShaderId = createBasicShader(
          { shaderManager, bufferManager },
          { colour: [255, 0, 0] },
        );
        entityManager.addComponent(
          entity,
          createShaderMaterialComponent({
            shader: sphereShaderId,
          }),
        );
      }
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

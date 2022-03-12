<script lang="ts">
  import { onMount } from 'svelte';
  import Stats from 'toolkit/stats';
  import Canvas from 'components/Canvas.svelte';
  import { createApp } from 'pages/app';
  import type { Application } from 'pages/app';
  import { CameraType } from 'toolkit/types/camera';
  import type { OrthographicCamera } from 'toolkit/types/camera';
  import { Pane } from 'tweakpane';
  import { setupConnectingLines, setupCorners } from './scene';

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
      camera.zoom = 0.1;

      setupCorners({ entityManager, shaderManager, bufferManager });
      setupConnectingLines({ entityManager, shaderManager, bufferManager });
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

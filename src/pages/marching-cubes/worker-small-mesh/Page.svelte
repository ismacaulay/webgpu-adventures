<script lang="ts">
  import { onMount } from 'svelte';
  import Stats from 'toolkit/stats';
  import Canvas from 'components/Canvas.svelte';
  import { createApp } from 'pages/app';
  import type { Application } from 'pages/app';
  import { CameraType } from 'toolkit/types/camera';
  import type { OrthographicCamera } from 'toolkit/types/camera';
  import { Pane } from 'tweakpane';
  import type { Unsubscriber } from 'toolkit/types/events';
  /* import { vec3 } from 'gl-matrix'; */
  import { buildScene } from './scene';
  import type { Shader } from 'toolkit/types/webgpu/shaders';
  /* import { getBoundingBoxCentre } from 'toolkit/math/bounding-box'; */
  /* import type { Shader } from 'toolkit/types/webgpu/shaders'; */

  let container: HTMLElement;
  let canvas: any;

  onMount(() => {
    let app: Application;
    let pane: Pane;
    let unsubs: Unsubscriber[] = [];
    let pool: any;

    (async () => {
      const stats = new (Stats as any)();
      stats.showPanel(0);
      container.appendChild(stats.dom);

      pane = new Pane({ title: 'settings' });
      const params = {
        wireframe: false,
      };

      let shaderId = -1;
      const input = pane.addInput(params, 'wireframe').on('change', () => {
        const shader = shaderManager.get<Shader>(shaderId);
        shader.update({ wireframe: params.wireframe });
      });
      input.disabled = true;

      app = await createApp(canvas.getElement(), { renderer: { enablePicking: true } });

      const { entityManager, bufferManager, shaderManager, cameraController } = app;

      cameraController.activeCamera = CameraType.Orthographic;
      buildScene(
        {
          entityManager,
          bufferManager,
          shaderManager,
          cameraController,
        },
        params,
      ).then((result) => {
        shaderId = result.shaderId;
        input.disabled = false;
      });

      /* const centre = getBoundingBoxCentre(boundingBox); */
      /* vec3.copy(camera.target, centre); */
      /* vec3.set(camera.position, centre[0], centre[1], 0); */
      /* camera.updateViewMatrix(); */

      /* pane.addInput(params, 'groundLevel', { min: -1, max: 1 }).on('change', () => { */
      /*   /1* const shader = shaderManager.get<Shader>(shaderId); *1/ */
      /*   /1* shader.update({ groundLevel: params.groundLevel }); *1/ */
      /*   // TODO: Regenerate mesh on ground level change */
      /* }); */

      app.onRenderBegin(() => {
        stats.begin();
      });
      app.onRenderEnd(() => {
        stats.end();
      });
      app.start();
    })();

    return () => {
      if (app) {
        app.destroy();
        pane.dispose();

        unsubs.forEach((unsub) => unsub());
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

<script lang="ts">
  import { onMount } from 'svelte';
  import Stats from 'toolkit/stats';
  import Canvas from 'components/Canvas.svelte';
  import { createApp } from 'pages/app';
  import type { Application } from 'pages/app';
  import { CameraType } from 'toolkit/types/camera';
  import type { OrthographicCamera } from 'toolkit/types/camera';
  import { Pane } from 'tweakpane';
  import { CORNER_IDS, setupConnectingLines, setupCorners } from './scene';
  import type { Unsubscriber } from 'toolkit/types/events';
  import { SelectionEventType } from 'toolkit/types/events/selection';
  import { ComponentType } from 'toolkit/types/ecs/components';
  import type { MaterialComponent } from 'toolkit/types/ecs/components';
  import type { Shader } from 'toolkit/types/webgpu/shaders';
  import type { GenericObject } from 'toolkit/types/generic';
  import { vec3 } from 'gl-matrix';

  let container: HTMLElement;
  let canvas: any;

  onMount(() => {
    let app: Application;
    let pane: Pane;
    let unsubs: Unsubscriber[] = [];

    (async () => {
      const stats = new (Stats as any)();
      stats.showPanel(0);
      container.appendChild(stats.dom);

      pane = new Pane({ title: 'settings' });

      app = await createApp(canvas.getElement(), { renderer: { enablePicking: true } });
      app.onRenderBegin(() => {
        stats.begin();
      });
      app.onRenderEnd(() => {
        stats.end();
      });
      app.start();

      const { entityManager, bufferManager, shaderManager, selectionController, cameraController } =
        app;

      cameraController.activeCamera = CameraType.Orthographic;
      const camera = cameraController.camera as OrthographicCamera;
      camera.zoom = 0.1;
      vec3.set(camera.position, 2.5, 1.3, 4);
      camera.updateViewMatrix();

      const { corners, entityToCorner } = setupCorners({
        entityManager,
        shaderManager,
        bufferManager,
      });
      setupConnectingLines({ entityManager, shaderManager, bufferManager });

      function setCornerSelected(corner: string, selected: boolean) {
        const entity = corners[corner];
        const [material] = entityManager.get(entity, [ComponentType.Material]) as [
          MaterialComponent,
        ];

        const shader = shaderManager.get<Shader>(material.shader);
        shader.update({ selected });
      }

      function createCornerInput(corner: string) {
        return pane
          .addInput(params, corner)
          .on('change', () => setCornerSelected(corner, params[corner]));
      }

      const params: GenericObject<boolean> = {
        [CORNER_IDS[0]]: false,
        [CORNER_IDS[1]]: false,
        [CORNER_IDS[2]]: false,
        [CORNER_IDS[3]]: false,
        [CORNER_IDS[4]]: false,
        [CORNER_IDS[5]]: false,
        [CORNER_IDS[6]]: false,
        [CORNER_IDS[7]]: false,
      };
      const inputs: GenericObject<any> = {
        [CORNER_IDS[0]]: createCornerInput(CORNER_IDS[0]),
        [CORNER_IDS[1]]: createCornerInput(CORNER_IDS[1]),
        [CORNER_IDS[2]]: createCornerInput(CORNER_IDS[2]),
        [CORNER_IDS[3]]: createCornerInput(CORNER_IDS[3]),
        [CORNER_IDS[4]]: createCornerInput(CORNER_IDS[4]),
        [CORNER_IDS[5]]: createCornerInput(CORNER_IDS[5]),
        [CORNER_IDS[6]]: createCornerInput(CORNER_IDS[6]),
        [CORNER_IDS[7]]: createCornerInput(CORNER_IDS[7]),
      };

      selectionController.on((e) => {
        if (e.type === SelectionEventType.Selected) {
          const corner = entityToCorner[e.entity];
          params[corner] = true;
          inputs[corner].refresh();
        } else if (e.type === SelectionEventType.Cleared) {
          CORNER_IDS.forEach((c) => {
            params[c] = false;
            inputs[c].refresh();
          });
        }
      });
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

<script lang="ts">
  import { onMount } from 'svelte';
  import Stats from 'toolkit/stats';
  import Canvas from 'components/Canvas.svelte';
  import { createApp } from 'pages/app';
  import type { Application } from 'pages/app';
  import { Pane } from 'tweakpane';
  import { vec3 } from 'gl-matrix';
  import { generateBentoBox } from 'pages/utils/bento';
  import { fromTpColour } from 'pages/utils/tweak-pane-utils';
  import type { MaterialComponent } from 'toolkit/types/ecs/components';
  import { ComponentType } from 'toolkit/types/ecs/components';

  let container: HTMLElement;
  let canvas: any;

  onMount(() => {
    let app: Application;
    let pane: Pane;

    const params = {};

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
      const params = {
        cube: {
          colour: { r: 34, g: 160, b: 166 },
          opacity: 0.5,
        },
      };
      const { entityManager, bufferManager, shaderManager, textureManager, cameraController } = app;

      const camera = cameraController.camera;
      vec3.set(camera.position, 0, 0, 3);
      camera.updateViewMatrix();

      const { cube } = generateBentoBox(
        {
          entityManager,
          bufferManager,
          shaderManager,
        },
        {
          cube: {
            material: { colour: fromTpColour(params.cube.colour), opacity: params.cube.opacity },
          },
        },
      );

      function updateEntityMaterial(entity: number, uniforms: any) {
        const [material] = entityManager.get(entity, [ComponentType.Material]) as [
          MaterialComponent,
        ];

        material.uniforms = {
          ...material.uniforms,
          ...uniforms,
        };
        material.needsUpdate = true;
      }

      function createBasicObjectControls(
        pane: Pane,
        { title, params, entity }: { title: string; params: any; entity: number },
      ) {
        const folder = pane.addFolder({ title });
        folder.addInput(params, 'colour').on('change', () => {
          updateEntityMaterial(entity, { colour: fromTpColour(params.colour) });
        });
        folder.addInput(params, 'opacity', { min: 0.0, max: 1.0 }).on('change', () => {
          updateEntityMaterial(entity, { opacity: params.opacity });
        });
      }

      createBasicObjectControls(pane, {
        title: 'cube',
        params: params.cube,
        entity: cube,
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

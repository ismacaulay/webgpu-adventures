<script lang="ts">
  import { onMount } from 'svelte';
  import Stats from 'toolkit/stats';
  import Canvas from 'components/Canvas.svelte';
  import { createApp } from 'pages/app';
  import type { Application } from 'pages/app';
  import { Pane } from 'tweakpane';
  import { vec3 } from 'gl-matrix';
  import { fromTpColour } from 'pages/utils/tweak-pane-utils';
  import type { MaterialComponent } from 'toolkit/types/ecs/components';
  import { ComponentType } from 'toolkit/types/ecs/components';
  import { generateBentoBox } from 'toolkit/utils/scenes/bento';

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
          wireframe: true,
          colour: { r: 34, g: 160, b: 166 },
          opacity: 0.5,
        },
        sphere: {
          wireframe: true,
          colour: { r: 14, g: 182, b: 32 },
          opacity: 0.75,
        },
      };
      const { entityManager, bufferManager, shaderManager, textureManager, cameraController } = app;

      const camera = cameraController.camera;
      vec3.set(camera.position, 0, 0, 3);
      camera.updateViewMatrix();

      const { cube, sphere } = generateBentoBox(
        {
          entityManager,
          bufferManager,
          shaderManager,
        },
        {
          cube: {
            transform: {
              translation: [-2, 0, 0],
              scale: [1, 2, 1],
            },
            material: {
              colour: fromTpColour(params.cube.colour),
              opacity: params.cube.opacity,
              wireframe: params.cube.wireframe,
            },
          },
          sphere: {
            material: {
              colour: fromTpColour(params.sphere.colour),
              opacity: params.sphere.opacity,
              wireframe: params.sphere.wireframe,
            },
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
        folder.addInput(params, 'wireframe').on('change', () => {
          updateEntityMaterial(entity, { wireframe: params.wireframe });
        });
      }

      createBasicObjectControls(pane, {
        title: 'cube',
        params: params.cube,
        entity: cube,
      });
      createBasicObjectControls(pane, {
        title: 'sphere',
        params: params.sphere,
        entity: sphere,
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

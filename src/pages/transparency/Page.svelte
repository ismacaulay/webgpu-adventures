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
          colour: { r: 210, g: 17, b: 25 },
          opacity: 0.5,
        },
        sphere: {
          wireframe: true,
          colour: { r: 14, g: 182, b: 32 },
          opacity: 0.5,
        },
        cone: {
          wireframe: true,
          colour: { r: 98, g: 108, b: 236 },
          opacity: 0.5,
        },
      };
      const { entityManager, bufferManager, shaderManager, textureManager, cameraController } = app;

      const camera = cameraController.camera;
      camera.updateViewMatrix();

      const { cube, sphere, cone } = generateBentoBox(
        {
          entityManager,
          bufferManager,
          shaderManager,
        },
        {
          cube: {
            transform: {
              translation: [-1.5, 0, 0],
            },
            material: {
              colour: fromTpColour(params.cube.colour),
              opacity: params.cube.opacity,
              wireframe: params.cube.wireframe,
            },
          },
          sphere: {
            radius: 0.5,
            material: {
              colour: fromTpColour(params.sphere.colour),
              opacity: params.sphere.opacity,
              wireframe: params.sphere.wireframe,
            },
          },
          cone: {
            radius: 0.5,
            transform: {
              translation: [1.5, 0, 0],
            },
            material: {
              colour: fromTpColour(params.cone.colour),
              opacity: params.cone.opacity,
              wireframe: params.cone.wireframe,
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
      createBasicObjectControls(pane, {
        title: 'cone',
        params: params.cone,
        entity: cone,
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

<script lang="ts">
  import { onMount } from 'svelte';
  import Stats from 'toolkit/stats';
  import Canvas from 'components/Canvas.svelte';
  import { createApp } from 'pages/app';
  import type { Application } from 'pages/app';
  import { Pane } from 'tweakpane';
  import type { Unsubscriber } from 'toolkit/types/events';
  import { buildScene, DensityFnType } from './scene';

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
      app = await createApp(canvas.getElement(), { renderer: { enablePicking: false } });

      pane = new Pane({ title: 'settings' });
      const params = {
        densityFn: DensityFnType.Noise,

        noise: {
          seed: 42,
          scale: 10,
          octaves: 8,
          persistence: 0.2,
          lacunarity: 2.0,
          offset: { x: 0, y: 0, z: 0 },
        },

        sphere: {
          radius: 20,
        },

        ellipse: {
          a: 10,
          b: 5,
          c: 3,
        },

        mesh: {
          colour: { r: 1.0, g: 0.0, b: 1.0 },
          wireframe: false,
        },
      };

      function generate() {
        buildScene(app, params).then((result) => {});
      }

      pane
        .addInput(params, 'densityFn', {
          options: {
            [DensityFnType.Noise]: DensityFnType.Noise,
            [DensityFnType.Sphere]: DensityFnType.Sphere,
            [DensityFnType.Ellipse]: DensityFnType.Ellipse,
          },
          label: 'density fn',
        })
        .on('change', handleDensityFnChanged);

      let densityInputs: any[] = [];
      const densityParamsFolder = pane.addFolder({ title: 'settings' });
      function handleDensityFnChanged() {
        densityInputs.forEach((input) => input.dispose());
        densityInputs = [];

        if (params.densityFn === DensityFnType.Noise) {
          densityInputs.push(
            densityParamsFolder.addInput(params.noise, 'seed'),
            densityParamsFolder.addInput(params.noise, 'scale'),
            densityParamsFolder.addInput(params.noise, 'octaves'),
            densityParamsFolder.addInput(params.noise, 'persistence'),
            densityParamsFolder.addInput(params.noise, 'lacunarity'),
            densityParamsFolder.addInput(params.noise, 'offset'),
          );
        } else if (params.densityFn === DensityFnType.Sphere) {
          densityInputs.push(
            densityParamsFolder.addInput(params.sphere, 'radius', {
              min: 1,
              max: 20,
            }),
          );
        } else if (params.densityFn === DensityFnType.Ellipse) {
          densityInputs.push(
            densityParamsFolder.addInput(params.ellipse, 'a', {
              min: 1,
              max: 20,
            }),
            densityParamsFolder.addInput(params.ellipse, 'b', {
              min: 1,
              max: 20,
            }),
            densityParamsFolder.addInput(params.ellipse, 'c', {
              min: 1,
              max: 20,
            }),
          );
        }

        densityInputs.push(
          densityParamsFolder.addButton({ title: 'generate' }).on('click', generate),
        );
      }
      handleDensityFnChanged();

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

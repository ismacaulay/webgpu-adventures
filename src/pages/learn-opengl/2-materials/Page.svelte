<script lang="ts">
  import { setup, Shading } from './setup';
  import { onMount } from 'svelte';
  import { Pane } from 'tweakpane';
  import Canvas from 'components/Canvas.svelte';
  import type { Application } from 'pages/app';
  import { createApp } from 'pages/app';
  import { CameraControls } from 'toolkit/types/camera';
  import { Materials } from 'toolkit/materials';

  let canvas: any;
  onMount(() => {
    let app: Application;
    let pane: Pane;

    (async () => {
      const params = {
        shading: Shading.Phong,
        material: Materials.Default,
      };
      pane = new Pane({ title: 'materials' });
      app = await createApp(canvas.getElement(), { camera: { controls: CameraControls.Free } });
      const controller = setup(app);
      controller.setShading(params.shading);
      if (params.shading === Shading.Phong) {
        controller.setMaterial(params.material);
      }

      let materialInput: any = undefined;
      function setupMaterialSelect() {
        if (params.shading === Shading.Phong) {
          materialInput = pane
            .addInput(params, 'material', {
              options: {
                [Materials.Default]: Materials.Default,
                [Materials.Emerald]: Materials.Emerald,
                [Materials.Pearl]: Materials.Pearl,
                [Materials.Gold]: Materials.Gold,
                [Materials.CyanPlastic]: Materials.CyanPlastic,
              },
            })
            .on('change', () => {
              controller.setMaterial(params.material);
            });
        } else {
          pane.remove(materialInput);
          materialInput = undefined;
        }
      }

      pane
        .addInput(params, 'shading', {
          options: {
            gouraud: Shading.Gouraud,
            phong: Shading.Phong,
          },
        })
        .on('change', () => {
          controller.setShading(params.shading);
          setupMaterialSelect();
        });
      setupMaterialSelect();

      app.start();
    })();

    return () => {
      if (app) {
        app.destroy();
        pane.dispose();
      }
    };
  });
</script>

<Canvas bind:this={canvas} />

<script lang="ts">
  import { setup, Shading } from './renderer';
  import { Materials, CommonMaterials } from 'toolkit/materials';
  import { onMount } from 'svelte';
  import { Pane } from 'tweakpane';
  import Canvas from 'components/Canvas.svelte';

  let canvas: any;
  onMount(() => {
    let app: any;
    let pane: Pane;

    (async () => {
      const params = {
        shading: Shading.Phong,
        material: Materials.Default,
      };
      pane = new Pane({ title: 'materials' });

      app = await setup(canvas.getElement());
      app.setShading(params.shading);
      if (params.shading === Shading.Phong) {
        app.setMaterial(params.material);
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
              app.setMaterial(params.material);
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
          app.setShading(params.shading);
          setupMaterialSelect();
        });
      setupMaterialSelect();
    })();

    return () => {
      if (app) {
        app.destroy();
      }
    };
  });
</script>

<Canvas bind:this={canvas} />

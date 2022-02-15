<script>
  import { setup } from './renderer';
  import { CommonMaterials } from 'toolkit/materials';
  import { onMount } from 'svelte';
  import { Pane } from 'tweakpane';
  import Canvas from 'components/Canvas.svelte';

  let canvas;
  onMount(() => {
    let app;
    let pane;

    (async () => {
      pane = new Pane({ title: 'materials' });

      app = await setup(canvas.getElement());

      // app.setMaterial(CommonMaterials[model.material]);

      // const materialSelectionController = gui.add(model, 'material', Object.keys(CommonMaterials));
      // materialSelectionController.onChange(function (material) {
      //   app.setMaterial(CommonMaterials[material]);
      // });
    })();

    return () => {
      if (app) {
        app.destroy();
      }
    };
  });
</script>

<Canvas bind:this={canvas} />

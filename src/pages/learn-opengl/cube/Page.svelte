<script>
  import { onMount } from 'svelte';
  import * as dat from 'dat.gui';
  import Canvas from 'components/Canvas.svelte';
  import { createCubeRenderer } from './renderer';

  function controls() {
    this.texture = 1;
  }

  let canvas;
  onMount(() => {
    let renderer;
    let gui;

    (async () => {
      renderer = await createCubeRenderer(canvas.getElement());

      const model = new controls();

      gui = new dat.GUI();
      const textureEnabledController = gui.add(model, 'texture', 0, 1);
      textureEnabledController.onChange(function (enabled) {
        renderer.enableTextures(enabled);
      });
    })();

    return () => {
      if (renderer) {
        renderer.destroy();
      }

      if (gui) {
        gui.destroy();
      }
    };
  });
</script>

<Canvas bind:this={canvas} />

<script>
  import { onMount } from 'svelte';
  import Canvas from 'components/Canvas.svelte';
  import { createCubeRenderer } from './renderer';

  let canvas;
  onMount(() => {
    let renderer;

    (async () => {
      try {
        renderer = await createCubeRenderer(canvas.getElement());
      } catch (e) {
        console.log(e);
      }
    })();

    return () => {
      if (renderer) {
        renderer.destroy();
      }
    };
  });
</script>

<Canvas bind:this={canvas} />

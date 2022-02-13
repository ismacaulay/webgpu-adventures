<script>
  import { onMount } from 'svelte';
  import Canvas from 'components/Canvas.svelte';
  import { createCubeRenderer } from './renderer';

  let canvas;
  onMount(() => {
    let renderer;

    (async () => {
      renderer = await createCubeRenderer(canvas.getElement());
    })();

    return () => {
      if (renderer) {
        renderer.destroy();
      }
    };
  });
</script>

<Canvas bind:this={canvas} />

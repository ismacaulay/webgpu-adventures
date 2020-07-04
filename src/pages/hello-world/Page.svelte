<script>
    import { onMount } from 'svelte';
    import Canvas from 'components/Canvas.svelte';
    import { createTriangleRenderer } from './renderer';

    let canvas;
    onMount(() => {
        let renderer;

        (async () => {
            renderer = await createTriangleRenderer(canvas.getElement());
            renderer.start();

        })();

        return () => {
            if (renderer) {
                renderer.destroy();
            }
        };
    });
</script>

<Canvas bind:this={canvas}/>


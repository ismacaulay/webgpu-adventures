<script>
    import { onMount } from 'svelte';
    import { createTriangleRenderer } from '../rendering/triangle-renderer';
    import Canvas from '../components/Canvas.svelte';

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


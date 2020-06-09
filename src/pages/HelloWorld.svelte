<script>
    import { onMount } from 'svelte';
    import { createTriangleRenderer } from '../rendering/triangle-renderer';
    import Canvas from '../components/Canvas.svelte';

    let canvas;
    onMount(async () => {
        const renderer = await createTriangleRenderer(canvas.getElement());
        renderer.start();

        return () => {
            renderer.stop();
        };
    });
</script>

<Canvas bind:this={canvas}/>


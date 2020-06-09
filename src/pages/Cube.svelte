<script>
    import { createCubeRenderer } from 'rendering/cube-renderer';
    import { onMount } from 'svelte';
    import Canvas from '../components/Canvas.svelte';

    let canvas;
    onMount(async () => {
        return await createCubeRenderer(canvas.getElement());
    });
</script>

<Canvas bind:this={canvas}/>


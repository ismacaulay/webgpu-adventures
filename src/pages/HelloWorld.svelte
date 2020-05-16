<script>
    import { onMount } from 'svelte';
    import { createRenderer, webGPUSupported } from '../renderer';

    let canvasElement;
    let showNotSupported = false;
    onMount(async () => {
        if (webGPUSupported()) {
            const renderer = await createRenderer(canvasElement);
            renderer.start();
        } else {
            showNotSupported = true;
        }
    });
</script>

<div>
    {#if showNotSupported}
        <p>WebGPU not supported in this browser yet!</p>
    {:else}
        <canvas bind:this={canvasElement} />
    {/if}
</div>

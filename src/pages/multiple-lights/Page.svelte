<script>
    import { onMount } from 'svelte';
    import { create } from './renderer'
    import Stats from 'toolkit/stats';

    import Canvas from '../../components/Canvas.svelte';

    let container;
    let canvas;
    onMount(() => {
        let renderer;
        let unmounted = false;

        (async () => {
            const stats = new Stats();
            stats.showPanel(0);
            container.appendChild(stats.dom);

            renderer = await create(canvas.getElement(),
            {
                onRenderBegin: () => {
                    stats.begin();
                },

                onRenderFinish: () => {
                    stats.end();
                },
            });

            // if we unmount before page has resolved, we will just destroy the page
            if (unmounted) {
                renderer.destroy();
            }

        })();

        return () => {
            unmounted = true;

            if (renderer) {
                renderer.destroy();
            }
        };
    });
</script>
<style>
    .container {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .stats-container {
        position: absolute;
        left: 5px;
        top: 0;
    }
</style>
<div class="container">
    <Canvas bind:this={canvas} />
    <div class="stats-container" bind:this={container}/>
</div>

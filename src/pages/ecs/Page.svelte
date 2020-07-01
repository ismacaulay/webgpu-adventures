<script>
    import { onMount } from 'svelte';
    import { create } from './ecs'
    import Stats from 'toolkit/stats';

    import Canvas from '../../components/Canvas.svelte';

    let container;
    let canvas;
    onMount(() => {
        let page;
        let unmounted = false;

        (async () => {
            const stats = new Stats();
            console.log(stats);
            stats.showPanel(0);
            container.appendChild(stats.dom);

            page = await create(canvas.getElement(),
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
                page.destroy();
            }

        })();

        return () => {
            unmounted = true;

            if (page) {
                page.destroy();
            }
        };
    });
</script>
<style>
    .container {
        position: relative;
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

<script>
    import { onMount } from 'svelte';
    import { create } from './lighting-maps.ts'
    import Stats from 'toolkit/stats';

    import Canvas from '../../components/Canvas.svelte';

    let container;
    let canvas;
    onMount(() => {
        let page;

        (async () => {
            const stats = new Stats();
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
        })();

        return () => {
            if (page) {
                page.destroy();
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

<script>
    import { onMount } from 'svelte';
    import { create } from './ecs'
    import Canvas from '../components/Canvas.svelte';

    let canvas;
    onMount(() => {
        let page;
        let unmounted = false;

        (async () => {
            page = await create(canvas.getElement());

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

<Canvas bind:this={canvas} />

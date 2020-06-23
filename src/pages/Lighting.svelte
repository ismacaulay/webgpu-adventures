<script>
    import { createLightingRenderer } from 'rendering/lighting-renderer';
    import { onMount } from 'svelte';
    import Canvas from '../components/Canvas.svelte';
    import * as dat from 'dat.gui';

    let canvas;
    onMount(() => {
        let renderer;
        let gui;

        (async () => {
            renderer = await createLightingRenderer(canvas.getElement());

            // const model = new controls();

            // gui = new dat.GUI();
            // const textureEnabledController = gui.add(model, 'texture', 0, 1);
            // textureEnabledController.onChange(function (enabled) {
            //     renderer.enableTextures(enabled);
            // });
        })();

        return () => {
            if (renderer) {
                renderer.destroy();
            }

            if (gui) {
                gui.destroy();
            }
        };
    });
</script>

<Canvas bind:this={canvas} />

<script>
    import { createCubeRenderer } from 'rendering/cube-renderer';
    import { onMount } from 'svelte';
    import Canvas from '../components/Canvas.svelte';
    import * as dat from 'dat.gui';

    function controls() {
        this.texture = 1;
    }

    let canvas;
    onMount(() => {
        let renderer;
        let gui;

        (async () => {
            renderer = await createCubeRenderer(canvas.getElement());

            const model = new controls();

            gui = new dat.GUI();
            const textureEnabledController = gui.add(model, 'texture', { Enabled: 1, Mixed: 0.5, Off: 0 });
            textureEnabledController.onChange(function (enabled) {
                renderer.enableTextures(enabled);
            });
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

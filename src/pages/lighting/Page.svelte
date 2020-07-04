<script>
    import { createLightingRenderer } from './renderer';
    import { CommonMaterials } from 'toolkit/materials'
    import { onMount } from 'svelte';
    import Canvas from 'components/Canvas.svelte';
    import * as dat from 'dat.gui';

    function uiModel() {
        this.material = Object.keys(CommonMaterials)[0];
    }

    let canvas;
    onMount(() => {
        let renderer;
        let gui;

        (async () => {
            renderer = await createLightingRenderer(canvas.getElement());

            const model = new uiModel();
            renderer.setMaterial(CommonMaterials[model.material]);

            gui = new dat.GUI();
            const materialSelectionController = gui.add(
                model,
                'material',
                Object.keys(CommonMaterials),
            );
            materialSelectionController.onChange(function (material) {
                renderer.setMaterial(CommonMaterials[material]);
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

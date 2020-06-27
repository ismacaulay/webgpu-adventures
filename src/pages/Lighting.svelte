<script>
    import { createLightingRenderer } from 'rendering/lighting-renderer';
    import { onMount } from 'svelte';
    import Canvas from '../components/Canvas.svelte';
    import * as dat from 'dat.gui';

    const materials = {
        emerald: {
            ambient: [0.0215, 0.1745, 0.0215],
            diffuse: [0.07568, 0.61424, 0.07568],
            specular: [0.633, 0.727811, 0.633],
            shininess: 0.6 * 128,
        },
        pearl: {
            ambient: [0.25, 0.20725, 0.20725],
            diffuse: [1, 0.829, 0.829],
            specular: [0.296648, 0.296648, 0.296648],
            shininess: 0.088 * 128,
        },
        gold: {
            ambient: [0.24725, 0.1995, 0.0745],
            diffuse: [0.75164, 0.60648, 0.22648],
            specular: [0.628281, 0.555802, 0.366065],
            shininess: 0.4 * 128,
        },
        cyan_plastic: {
            ambient: [0.0, 0.1, 0.06],
            diffuse: [0.0, 0.50980392, 0.50980392],
            specular: [0.50196078, 0.50196078, 0.50196078],
            shininess: 0.25 * 128,
        },
    };
    function uiModel() {
        this.material = Object.entries(materials)[0][0];
    }

    let canvas;
    onMount(() => {
        let renderer;
        let gui;

        (async () => {
            renderer = await createLightingRenderer(canvas.getElement());

            const model = new uiModel();
            renderer.setMaterial(materials[model.material]);

            gui = new dat.GUI();
            const materialSelectionController = gui.add(
                model,
                'material',
                Object.keys(materials),
            );
            materialSelectionController.onChange(function (material) {
                renderer.setMaterial(materials[material]);
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

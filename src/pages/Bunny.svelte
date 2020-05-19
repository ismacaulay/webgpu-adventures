<script>
    import { onMount } from 'svelte';
    import { load } from '../utils/obj-loader';
    // import { createRenderer } from '../rendering/renderer';

    onMount(async () => {
        const { vertices, faces } = await load('/models/bunny.obj')
        
        // const renderer = createRenderer();
        
        // const positionBuffer = renderer.createBuffer(vertices, GPUBufferUsage.VERTEX);
        // const indexBuffer = renderer.createBuffer(faces, GPUBufferUsage.INDEX);

        // let raf = -1;
        // function render() {
        //     renderer.update()

        //     raf = requestAnimationFrame(render);
        // }

        // return () => {
        //     cancelAnimationFrame(raf);

        //     positionBuffer.destroy();
        //     indexBuffer.destroy()
        // }
    });
</script>

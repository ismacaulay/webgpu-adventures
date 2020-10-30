<script>
    import router from 'page';
    import Home from './pages/Home.svelte';
    import HelloWorld from './pages/hello-world/Page.svelte';
    import ECS from './pages/ecs/Page.svelte';
    import Cube from './pages/cube/Page.svelte';
    import RotatingCube from './pages/rotating-cube/Page.svelte';
    import Lighting from './pages/lighting/Page.svelte';
    import LightingMaps from './pages/lighting-maps/Page.svelte';
    import LightCasters from './pages/light-casters/Page.svelte';
    import MultipleLights from './pages/multiple-lights/Page.svelte';
    import DepthTesting from './pages/depth-testing/Page.svelte';
    import StencilTesting from './pages/stencil-testing/Page.svelte';
    import Blending from './pages/blending/Page.svelte';

    const examples = [
        { title: 'hello-world', component: HelloWorld },
        { title: 'ecs', component: ECS },
        { title: 'learn-opengl/basics', component: Cube },
        { title: 'learn-opengl/transformations', component: RotatingCube },
        { title: 'learn-opengl/materials', component: Lighting },
        { title: 'learn-opengl/lighting-maps', component: LightingMaps },
        { title: 'learn-opengl/light-casters', component: LightCasters },
        { title: 'learn-opengl/multiple-lights', component: MultipleLights },
        { title: 'learn-opengl/depth-testing', component: DepthTesting },
        { title: 'learn-opengl/stencil-testing', component: StencilTesting },
        { title: 'learn-opengl/blending', component: Blending },
    ];

    let page;
    router('/', () => (page = Home));
    for (let i = 0; i < examples.length; i++) {
        const example = examples[i];
        router(`/${example.title}`, () => (page = example.component));
    }

    router.start();
</script>

<style>
    main {
        display: flex;
        flex-direction: row;
        width: 100vw;
    }

    h1 {
        font-size: 14pt;
        text-align: center;
        margin-bottom: 40px;
    }

    #nav {
        position: relative;
        left: 0px;
        flex: 1;
        max-width: 300px;
        min-width: 300px;
        height: 100vh;
        overflow: auto;
        background: #ebebeb;
    }

    .nav-link {
        display: block;
        padding: 0 10px;
    }

    #panel {
        height: 100vh;
        width: 100%;
        overflow: auto;
    }

    a {
        text-decoration: none;
    }

    a:link,
    a:visited {
        color: #357785;
    }
    a:hover {
        text-decoration: underline;
    }
</style>

<main>
    <div id="nav">
        <h1>
            <a href="/">WebGPU Adventures</a>
        </h1>
        {#each examples as example}
            <a class="nav-link" href="/{example.title}">{example.title}</a>
        {/each}
    </div>
    <div id="panel">
        <svelte:component this={page} />
    </div>
</main>

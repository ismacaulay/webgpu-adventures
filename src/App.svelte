<script>
    import router from 'page';
    import HelloWorld from './pages/HelloWorld.svelte';
    import Home from './pages/Home.svelte';
    import Cube from './pages/Cube.svelte';
    import RotatingCube from './pages/RotatingCube.svelte';

    let examples = [
        {
            title: 'hello-world',
            route: '/hello-world',
            component: HelloWorld,
        },
        {
            title: 'cube',
            route: '/cube',
            component: Cube,
        },
        {
            title: 'rotating-cube',
            route: '/rotating-cube',
            component: RotatingCube,
        },
    ];

    let page;
    router('/', () => (page = Home));
    for (let i = 0; i < examples.length; i++) {
        const example = examples[i];
        router(example.route, () => (page = example.component));
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
            <a class="nav-link" href={example.route}>{example.title}</a>
        {/each}
    </div>
    <div id="panel">
        <svelte:component this={page} />
    </div>
</main>

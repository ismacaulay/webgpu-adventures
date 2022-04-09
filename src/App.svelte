<script>
  import router from 'page';
  import Home from './pages/Home.svelte';
  import basic from './pages/basic/pages';
  import learnOpenGL from './pages/learn-opengl/pages';
  import terrain from './pages/terrain/pages';
  import marchingCubes from './pages/marching-cubes/pages';

  let component;
  let base = '';

  router(`${base}/`, () => (component = Home));

  function addRoutes(pages) {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      router(`${base}/${page.title}`, () => (component = page.component));
    }
  }

  addRoutes(basic);
  addRoutes(learnOpenGL);
  addRoutes(terrain);
  addRoutes(marchingCubes);

  router.start();
</script>

<style>
  .container {
    width: 100vw;
    height: 100vh;
  }
</style>

<svelte:head>
  <title>webgpu adventures</title>
</svelte:head>

<div class="container">
  <svelte:component this={component} />
</div>

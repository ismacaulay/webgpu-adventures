<script>
  import router from 'page';
  import Home from './pages/Home.svelte';
  import examples from './pages/examples';

  let page;
  router('/', () => (page = Home));
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    router(`/${example.title}`, () => (page = example.component));
  }

  router.start();
</script>

<style>
  /* main { */
  /*   display: flex; */
  /*   flex-direction: row; */
  /*   width: 100vw; */
  /* } */
  #panel {
    height: 100vh;
    width: 100%;
    overflow: auto;
  }
</style>

<div id="panel">
  <svelte:component this={page} />
</div>

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
  /* chrome canary overflows with height 100 */
  .container {
    width: 100vw;
    height: 99vh;
  }
</style>

<div class="container">
  <svelte:component this={page} />
</div>

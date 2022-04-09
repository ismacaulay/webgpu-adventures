<script>
  import ExternalLink from 'components/ExternalLink.svelte';

  import Basic from './basic/index.svelte';
  import LearnOpenGL from './learn-opengl/index.svelte';
  import TerrainGeneration from './terrain/index.svelte';
  import MarchingCubes from './marching-cubes/index.svelte';
</script>

<style>
  h1 {
    text-align: center;
    font-weight: 400;
    margin: 0;
  }

  .container {
    margin: 1em auto;
    max-width: 750px;
  }

  .header-container {
    margin-bottom: 1.5em;
    text-align: center;
  }
</style>

<div class="container">
  <div class="header-container">
    <h1>webgpu adventures</h1>
    <ExternalLink href="https://github.com/ismacaulay/webgpu-adventures/">github</ExternalLink>
  </div>

  <Basic />
  <LearnOpenGL />
  <TerrainGeneration />
  <MarchingCubes />
</div>

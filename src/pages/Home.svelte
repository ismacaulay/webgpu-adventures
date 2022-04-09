<script>
  import Basic from './basic/index.svelte';
  import LearnOpenGL from './learn-opengl/index.svelte';
  import TerrainGeneration from './terrain/index.svelte';
  import MarchingCubes from './marching-cubes/index.svelte';
</script>

<style>
  h1 {
    /* font-size: 14pt; */
    text-align: center;
    margin-bottom: 40px;
  }
</style>

<h1>webgpu adventures</h1>

<Basic />
<LearnOpenGL />
<TerrainGeneration />
<MarchingCubes />

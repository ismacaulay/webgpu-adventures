/*
 * For some reason VSCode marks all of these imports as errors because they
 * are not modules. rollup does not consider them errors, neither does nvim
 */
// @ts-ignore
import HelloWorld from './hello-world/Page.svelte';
// @ts-ignore
import Cube from './cube/Page.svelte';
// @ts-ignore
import TexturedCube from './learn-opengl/1-textured-cube/Page.svelte';
// @ts-ignore
import Materials from './learn-opengl/2-materials/Page.svelte';
// @ts-ignore
import LightingMaps from './learn-opengl/3-lighting-maps/Page.svelte';
// @ts-ignore
import LightCasters from './learn-opengl/4-light-casters/Page.svelte';
// @ts-ignore
import MultipleLights from './learn-opengl/5-multiple-lights/Page.svelte';
// @ts-ignore
import DepthTesting from './learn-opengl/6-depth-testing/Page.svelte';
// @ts-ignore
import StencilTesting from './learn-opengl/7-stencil-testing/Page.svelte';
// @ts-ignore
import NoiseMap from './terrain/NoiseMap.svelte';
// @ts-ignore
import Terrain from './terrain/Terrain.svelte';

export default [
  { title: 'hello-world', component: HelloWorld },
  { title: 'cube', component: Cube },

  { title: 'learn-opengl/basics', component: TexturedCube },
  { title: 'learn-opengl/materials', component: Materials },
  { title: 'learn-opengl/lighting-maps', component: LightingMaps },
  { title: 'learn-opengl/light-casters', component: LightCasters },
  { title: 'learn-opengl/multiple-lights', component: MultipleLights },
  { title: 'learn-opengl/depth-testing', component: DepthTesting },
  { title: 'learn-opengl/stencil-testing', component: StencilTesting },

  { title: 'terrain/noise-map', component: NoiseMap },
  { title: 'terrain/terrain', component: Terrain },
];

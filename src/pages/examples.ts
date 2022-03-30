import HelloWorld from './hello-world/Page.svelte';
import Cube from './cube/Page.svelte';

import TexturedCube from './learn-opengl/1-textured-cube/Page.svelte';
import Materials from './learn-opengl/2-materials/Page.svelte';
import LightingMaps from './learn-opengl/3-lighting-maps/Page.svelte';
import LightCasters from './learn-opengl/4-light-casters/Page.svelte';
import MultipleLights from './learn-opengl/5-multiple-lights/Page.svelte';
import DepthTesting from './learn-opengl/6-depth-testing/Page.svelte';
import StencilTesting from './learn-opengl/7-stencil-testing/Page.svelte';
import Blending from './learn-opengl/8-blending/Page.svelte';
import Framebuffers from './learn-opengl/9-framebuffers/Page.svelte';

import NoiseMap from './terrain/NoiseMap.svelte';
import Terrain from './terrain/Terrain.svelte';

import MarchingCubesCases from './marching-cubes/cases/Page.svelte';
import MarchingCubesSmallMesh from './marching-cubes/small-mesh/Page.svelte';

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
  { title: 'learn-opengl/blending', component: Blending },
  { title: 'learn-opengl/framebuffers', component: Framebuffers },

  { title: 'terrain/noise-map', component: NoiseMap },
  { title: 'terrain/terrain', component: Terrain },

  { title: 'marching-cubes/cases', component: MarchingCubesCases },
  { title: 'marching-cubes/small-mesh', component: MarchingCubesSmallMesh },
];

import HelloWorld from './hello-world/Page.svelte';
import Cube from './cube/Page.svelte';
// import ECS from './ecs/Page.svelte';
import TexturedCube from './learn-opengl/1-textured-cube/Page.svelte';
import Materials from './learn-opengl/2-materials/Page.svelte';
// import LightingMaps from './pages/learn-opengl/lighting-maps/Page.svelte';
// import LightCasters from './pages/learn-opengl/light-casters/Page.svelte';
// import MultipleLights from './pages/learn-opengl/multiple-lights/Page.svelte';
// import DepthTesting from './pages/learn-opengl/depth-testing/Page.svelte';
// import StencilTesting from './pages/learn-opengl/stencil-testing/Page.svelte';

export default [
  { title: 'hello-world', component: HelloWorld },
  { title: 'cube', component: Cube },
  { title: 'learn-opengl/basics', component: TexturedCube },
  { title: 'learn-opengl/materials', component: Materials },
  // { title: 'learn-opengl/lighting-maps', component: LightingMaps },
  // { title: 'learn-opengl/light-casters', component: LightCasters },
  // { title: 'learn-opengl/multiple-lights', component: MultipleLights },
  // { title: 'learn-opengl/depth-testing', component: DepthTesting },
  // { title: 'learn-opengl/stencil-testing', component: StencilTesting },
  // { title: 'ecs', component: ECS },
];

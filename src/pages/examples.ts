import HelloWorld from './hello-world/Page.svelte';
import Cube from './cube/Page.svelte';
// import ECS from './ecs/Page.svelte';
import TexturedCube from './learn-opengl/texturedCube/Page.svelte';
// import RotatingCube from './pages/learn-opengl/rotating-cube/Page.svelte';
// import Lighting from './pages/learn-opengl/lighting/Page.svelte';
// import LightingMaps from './pages/learn-opengl/lighting-maps/Page.svelte';
// import LightCasters from './pages/learn-opengl/light-casters/Page.svelte';
// import MultipleLights from './pages/learn-opengl/multiple-lights/Page.svelte';
// import DepthTesting from './pages/learn-opengl/depth-testing/Page.svelte';
// import StencilTesting from './pages/learn-opengl/stencil-testing/Page.svelte';

export default [
  { title: 'hello-world', component: HelloWorld },
  { title: 'cube', component: Cube },
  // { title: 'ecs', component: ECS },
  { title: 'learn-opengl/basics', component: TexturedCube },
  // { title: 'learn-opengl/transformations', component: RotatingCube },
  // { title: 'learn-opengl/materials', component: Lighting },
  // { title: 'learn-opengl/lighting-maps', component: LightingMaps },
  // { title: 'learn-opengl/light-casters', component: LightCasters },
  // { title: 'learn-opengl/multiple-lights', component: MultipleLights },
  // { title: 'learn-opengl/depth-testing', component: DepthTesting },
  // { title: 'learn-opengl/stencil-testing', component: StencilTesting },
];
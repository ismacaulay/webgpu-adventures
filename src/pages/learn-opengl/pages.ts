import TexturedCube from './1-textured-cube/Page.svelte';
import Materials from './2-materials/Page.svelte';
import LightingMaps from './3-lighting-maps/Page.svelte';
import LightCasters from './4-light-casters/Page.svelte';
import MultipleLights from './5-multiple-lights/Page.svelte';
import DepthTesting from './6-depth-testing/Page.svelte';
import StencilTesting from './7-stencil-testing/Page.svelte';
import Blending from './8-blending/Page.svelte';
import Framebuffers from './9-framebuffers/Page.svelte';

export default [
  { title: 'learn-opengl/basics', component: TexturedCube },
  { title: 'learn-opengl/materials', component: Materials },
  { title: 'learn-opengl/lighting-maps', component: LightingMaps },
  { title: 'learn-opengl/light-casters', component: LightCasters },
  { title: 'learn-opengl/multiple-lights', component: MultipleLights },
  { title: 'learn-opengl/depth-testing', component: DepthTesting },
  { title: 'learn-opengl/stencil-testing', component: StencilTesting },
  { title: 'learn-opengl/blending', component: Blending },
  { title: 'learn-opengl/framebuffers', component: Framebuffers },
];

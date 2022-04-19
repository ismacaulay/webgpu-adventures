import MarchingCubesCases from './cases/Page.svelte';
import MarchingCubesSmallMesh from './small-mesh/Page.svelte';
import MarchingCubesLargeMesh from './large-mesh/Page.svelte';
import MarchingCubesWorkerSmallMesh from './worker-small-mesh/Page.svelte';

export default [
  { title: 'marching-cubes/cases', component: MarchingCubesCases },
  { title: 'marching-cubes/small-mesh', component: MarchingCubesSmallMesh },
  { title: 'marching-cubes/large-mesh', component: MarchingCubesLargeMesh },
  { title: 'marching-cubes/worker-small-mesh', component: MarchingCubesWorkerSmallMesh },
];

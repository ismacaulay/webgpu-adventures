// export function createLightingSystem(
//   entityManager: EntityManager,
//   lightManager: LightManager,
//   shaderManager: ShaderManager,
//   camera: Camera,
// ) {
//   return {
//     update() {
//       const directionalLights = lightManager.all(LightType.Directional) as DirectionalLight[];
//       const pointLights = lightManager.all(LightType.Point) as PointLight[];
//       const spotLights = lightManager.all(LightType.Spot) as SpotLight[];

//       if (directionalLights.length === 0 && pointLights.length === 0 && spotLights.length === 0) {
//         return;
//       }

//       const directionalLightsUniforms = directionalLights.map((light) => ({
//         direction: light.direction,
//         ambient: light.ambient,
//         diffuse: light.diffuse,
//         specular: light.specular,
//       }));

//       const pointLightsUniforms = pointLights.map((light) => ({
//         position: light.position,
//         kc: light.kc,
//         kl: light.kl,
//         kq: light.kq,
//         ambient: light.ambient,
//         diffuse: light.diffuse,
//         specular: light.specular,
//       }));

//       const spotLightsUniforms = spotLights.map((light) => ({
//         position: light.position,
//         direction: light.direction,
//         inner_cutoff: light.inner_cutoff,
//         outer_cutoff: light.outer_cutoff,
//         kc: light.kc,
//         kl: light.kl,
//         kq: light.kq,
//         ambient: light.ambient,
//         diffuse: light.diffuse,
//         specular: light.specular,
//       }));

//       const view = entityManager.view([ComponentType.Material]);
//       let result = view.next();
//       while (!result.done) {
//         const material = result.value[0] as MaterialComponent;

//         if (material.lighting) {
//           const shader = shaderManager.get(material.shader);
//           shader.update({
//             view_pos: camera.position,
//             dir_lights: directionalLightsUniforms,
//             point_lights: pointLightsUniforms,
//             spot_lights: spotLightsUniforms,
//           });
//         }

//         result = view.next();
//       }
//     },
//   };
// }

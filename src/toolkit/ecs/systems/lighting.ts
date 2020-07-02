import { EntityManager } from '../entity-manager';
import {
    ComponentType,
    MaterialComponent,
    TransformComponent,
    LightComponent,
} from '../components';

export function createLightingSystem(entityManager: EntityManager) {
    return {
        update() {
            const lights = entityManager.all([
                ComponentType.Transform,
                ComponentType.Light,
            ]);

            if (lights.length === 0) {
                return;
            }

            const view = entityManager.view([ComponentType.Material]);
            let result = view.next();
            while (!result.done) {
                const material = result.value[0] as MaterialComponent;

                if (material.lighting) {
                    // TODO: How do we handle multiple lights
                    const lightInfo = lights[0];
                    const lightTransform = lightInfo[0] as TransformComponent;
                    const lightColor = lightInfo[0] as LightComponent;

                    material.uniforms.light = {
                        position: lightTransform.translation,
                        ambient: lightColor.ambient,
                        diffuse: lightColor.diffuse,
                        specular: lightColor.specular,
                    };
                }

                result = view.next();
            }
        },
    };
}

import { EntityManager } from '../entity-manager';
import {
    ComponentType,
    MaterialComponent,
    LightComponent,
    LightType,
} from '../components';

export function createLightingSystem(entityManager: EntityManager) {
    return {
        update() {
            debugger;
            const lights = entityManager.all([ComponentType.Light]);
            console.log(lights);
            if (lights.length === 0) {
                return;
            }

            const view = entityManager.view([ComponentType.Material]);
            let result = view.next();
            while (!result.done) {
                const material = result.value[0] as MaterialComponent;

                if (material.lighting) {
                    // TODO: How do we handle multiple lights
                    const light = lights[0][0] as LightComponent;

                    if (light.subtype === LightType.Basic) {
                        const { position, ambient, diffuse, specular } = light;
                        material.uniforms.light = {
                            position,
                            ambient,
                            diffuse,
                            specular,
                        };
                    } else if (light.subtype === LightType.Directional) {
                        const { direction, ambient, diffuse, specular } = light;
                        material.uniforms.light = {
                            direction,
                            ambient,
                            diffuse,
                            specular,
                        };
                    }
                }

                result = view.next();
            }
        },
    };
}

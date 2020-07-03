import { EntityManager } from '../entity-manager';
import {
    ComponentType,
    MaterialComponent,
    LightComponent,
    LightType,
    TransformComponent,
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
                    const transform = lights[0][0] as TransformComponent;
                    const light = lights[0][1] as LightComponent;

                    if (light.subtype === LightType.Basic) {
                        const { ambient, diffuse, specular } = light;
                        const { translation } = transform;

                        material.uniforms.light = {
                            position: translation,
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
                    } else if (light.subtype === LightType.Point) {
                        const { translation } = transform;
                        const {
                            ambient,
                            diffuse,
                            specular,
                            constant,
                            linear,
                            quadratic,
                        } = light;

                        material.uniforms.light = {
                            position: translation,
                            constant,
                            linear,
                            quadratic,
                            ambient,
                            diffuse,
                            specular,
                        };
                    } else if (light.subtype === LightType.Spot) {
                        const { translation } = transform;
                        const {
                            direction,
                            innerCutoff,
                            outerCutoff,
                            ambient,
                            diffuse,
                            specular,
                        } = light;

                        material.uniforms.light = {
                            position: translation,
                            direction,
                            innerCutoff,
                            outerCutoff,
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

import {
    ComponentType,
    TransformComponent,
    SpotLight,
} from 'toolkit/ecs/components';
import { Camera } from 'toolkit/camera';
import { EntityManager } from 'toolkit/ecs';

export function createFlashlightSystem(
    entityId: number,
    entityManager: EntityManager,
    camera: Camera,
) {
    return {
        update() {
            const components = entityManager.get(entityId, [
                ComponentType.Transform,
                ComponentType.Light,
            ]);

            const transform = components[0] as TransformComponent;
            const light = components[1] as SpotLight;

            transform.translation = camera.position;
            light.direction = camera.direction;
        },
    };
}

import {
    EntityManager,
    ComponentType,
    TransformComponent,
} from './entity-manager';

import { MovementComponent } from './movement-component';

export function createMovementSystem(entityManager: EntityManager) {
    return {
        update(dt: number) {
            const views = entityManager.view([
                ComponentType.Transform,
                ComponentType.Movement,
            ]);

            let result = views.next();
            while (!result.done) {
                const transform = result.value[0] as TransformComponent;
                const movement = result.value[1] as MovementComponent

                movement.update(dt);
                transform.multiply(movement.matrix);

                result = views.next();
            }
        },
    };
}

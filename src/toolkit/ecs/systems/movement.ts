import { EntityManager } from '../entity-manager';
import { ComponentType, TransformComponent } from '../components';
import { MovementComponent, MovementType } from '../components/movement';
import { vec3 } from 'gl-matrix';

export function createMovementSystem(entityManager: EntityManager) {
    let currentTime = 0;

    const right = vec3.create();
    const up = vec3.create();

    return {
        update(dt: number) {
            currentTime += dt;

            const view = entityManager.view([
                ComponentType.Movement,
                ComponentType.Transform,
            ]);
            let result = view.next();
            while (!result.done) {
                const component = result.value[0] as MovementComponent;
                const transform = result.value[1] as TransformComponent;

                if (component.subtype === MovementType.Circular) {
                    const { center, axis, radius, period } = component;

                    const dist = currentTime / period;
                    const frac = dist - Math.floor(dist);
                    const theta = 2 * Math.PI * frac;

                    vec3.cross(right, axis, [0, 1, 0]);
                    if (vec3.len(right) === 0) {
                        vec3.cross(right, axis, [1e-5, 1, 0]);
                    }

                    vec3.normalize(right, right);
                    vec3.normalize(up, vec3.cross(up, axis, right));

                    vec3.scale(right, right, radius * Math.cos(theta));
                    vec3.scale(up, up, radius * Math.sin(theta));
                    transform.translation = vec3.add(
                        up,
                        center,
                        vec3.add(right, up, right),
                    );
                }

                result = view.next();
            }
        },
    };
}

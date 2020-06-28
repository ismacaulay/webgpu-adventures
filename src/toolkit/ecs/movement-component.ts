import { Component, ComponentType } from './entity-manager';
import { mat4, createMat4 } from 'toolkit/math/mat4';
import { createVec3 } from 'toolkit/math/vec3';

export interface MovementComponent extends Component {
    type: ComponentType.Movement;

    readonly matrix: mat4;

    update(dt: number): void;
}

export function createCircularMovementComponent(): MovementComponent {
    const matrix = createMat4();

    let currentAngle = 0;
    let translation = createVec3();
    return {
        type: ComponentType.Movement,

        matrix,

        update(dt: number) {
            currentAngle += dt;
            currentAngle %= 2 * Math.PI;
            translation.set([
                Math.sin(currentAngle),
                0.0,
                Math.cos(currentAngle),
            ]);
            matrix.setTranslation(translation);
        },
    };
}

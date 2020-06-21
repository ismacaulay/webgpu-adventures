import { mat4, createMat4 } from 'toolkit/math/mat4';
import { vec3, createVec3 } from 'toolkit/math/vec3';

export interface Camera {
    readonly position: vec3;
    readonly up: vec3;
    readonly target: vec3;

    readonly matrix: mat4;
    
    updateViewMatrix(): void;
}

export function createCamera(): Camera {
    const matrix = createMat4();
    const position = createVec3();
    const up = createVec3([0, 1, 0]);
    const target = createVec3();

    return {
        position,
        up,
        target,

        matrix,
        
        updateViewMatrix() {
            matrix.lookAt(position, target, up)
        }
    };
}
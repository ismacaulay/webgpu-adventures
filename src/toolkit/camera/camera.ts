import { vec3, mat4, glMatrix } from 'gl-matrix';

export interface Camera {
    readonly position: vec3;
    readonly up: vec3;
    readonly target: vec3;

    readonly direction: vec3;

    readonly viewMatrix: mat4;
    readonly projectionMatrix: mat4;

    readonly fov: number;
    aspect: number;
    readonly near: number;
    readonly far: number;

    updateViewMatrix(): void;
    updateProjectionMatrix(): void;
}

export function createCamera() {
    const viewMatrix = mat4.create();
    const projectionMatrix = mat4.create();

    const position = vec3.create();
    const up = vec3.fromValues(0, 1, 0);
    const target = vec3.create();

    const fov = glMatrix.toRadian(45);
    let aspect = 1;
    const near = 0.1;
    const far = 1000;

    function updateViewMatrix() {
        mat4.lookAt(viewMatrix, position, target, up);
    }

    function updateProjectionMatrix() {
        mat4.perspective(projectionMatrix, fov, aspect, near, far);
    }

    updateViewMatrix();
    updateProjectionMatrix();

    return {
        position,
        up,
        target,

        get direction() {
            const dir = vec3.create();
            return vec3.normalize(dir, vec3.sub(dir, target, position));
        },

        viewMatrix,
        projectionMatrix,

        fov,
        get aspect() {
            return aspect;
        },
        set aspect(value: number) {
            aspect = value;
        },
        near,
        far,

        updateViewMatrix,
        updateProjectionMatrix,
    };
}

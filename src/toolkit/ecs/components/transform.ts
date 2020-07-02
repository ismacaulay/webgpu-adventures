import { ComponentType, Component } from './types';
import { vec3, mat4 } from 'gl-matrix';

export interface TransformComponent extends Component {
    type: ComponentType.Transform;

    translation: vec3;
    scale: vec3;

    readonly matrix: mat4;
}

export function createTransformComponent(initial: {
    translation?: vec3;
    scale?: vec3;
}): TransformComponent {
    let _translation = initial.translation
        ? vec3.clone(initial.translation)
        : vec3.fromValues(0, 0, 0);
    let _scale = initial.scale
        ? vec3.clone(initial.scale)
        : vec3.fromValues(1, 1, 1);

    let _matrix = mat4.create();

    function updateMatrix() {
        _matrix = mat4.create();
        mat4.translate(_matrix, _matrix, _translation);
        mat4.scale(_matrix, _matrix, _scale);
    }
    updateMatrix();

    return {
        type: ComponentType.Transform,

        set translation(t: vec3) {
            _translation = vec3.clone(t);
            updateMatrix();
        },
        get translation() {
            return _translation;
        },

        set scale(s: vec3) {
            _scale = vec3.clone(s);
            updateMatrix();
        },
        get scale() {
            return _scale;
        },

        get matrix() {
            return _matrix;
        },
    };
}

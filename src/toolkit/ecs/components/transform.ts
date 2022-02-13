import { ComponentType, Component } from './types';
import { vec3, mat4, quat } from 'gl-matrix';

export interface TransformComponent extends Component {
  type: ComponentType.Transform;

  translation: vec3;
  // TODO: this should be a quat
  rotation: {
    angle: number;
    axis: vec3;
  };
  scale: vec3;

  readonly matrix: mat4;
}

export function createTransformComponent(initial: {
  translation?: vec3;
  rotation?: { angle: number; axis: vec3 };
  scale?: vec3;
}): TransformComponent {
  let translation = initial.translation
    ? vec3.clone(initial.translation)
    : vec3.fromValues(0, 0, 0);
  let rotation = initial.rotation
    ? {
        angle: initial.rotation.angle,
        axis: vec3.clone(initial.rotation.axis),
      }
    : {
        angle: 0,
        axis: vec3.create(),
      };
  let scale = initial.scale ? vec3.clone(initial.scale) : vec3.fromValues(1, 1, 1);

  const matrix = mat4.create();

  function updateMatrix() {
    mat4.identity(matrix);
    mat4.translate(matrix, matrix, translation);
    mat4.rotate(matrix, matrix, rotation.angle, rotation.axis);
    mat4.scale(matrix, matrix, scale);
  }
  updateMatrix();

  return {
    type: ComponentType.Transform,

    set translation(t: vec3) {
      translation = vec3.clone(t);
      updateMatrix();
    },
    get translation() {
      return translation;
    },

    set rotation(r: any) {
      rotation = {
        angle: r.angle,
        axis: vec3.clone(r.axis),
      };
      updateMatrix();
    },
    get rotation() {
      return rotation;
    },

    set scale(s: vec3) {
      scale = vec3.clone(s);
      updateMatrix();
    },
    get scale() {
      return scale;
    },

    get matrix() {
      return matrix;
    },
  };
}

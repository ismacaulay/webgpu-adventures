import { mat4, vec3 } from 'gl-matrix';
import { ComponentType, TransformComponent } from 'toolkit/types/ecs/components';
import { createNeedsUpdate } from 'toolkit/utils';

export function createTransformComponent(initial: {
  translation?: vec3;
  rotation?: { angle: number; axis: vec3 };
  scale?: vec3;
}): TransformComponent {
  let _translation = initial.translation
    ? vec3.clone(initial.translation)
    : vec3.fromValues(0, 0, 0);
  let _rotation = initial.rotation
    ? {
        angle: initial.rotation.angle,
        axis: vec3.clone(initial.rotation.axis),
      }
    : {
        angle: 0,
        axis: vec3.create(),
      };
  let _scale = initial.scale ? vec3.clone(initial.scale) : vec3.fromValues(1, 1, 1);

  let _matrix = mat4.create();
  let _needsUpdate = true;

  function updateMatrix() {
    mat4.identity(_matrix);
    mat4.translate(_matrix, _matrix, _translation);
    mat4.rotate(_matrix, _matrix, _rotation.angle, _rotation.axis);
    mat4.scale(_matrix, _matrix, _scale);
  }
  updateMatrix();

  return {
    type: ComponentType.Transform,

    get needsUpdate() {
      return _needsUpdate;
    },
    set needsUpdate(value: boolean) {
      _needsUpdate = value;
    },

    set translation(t: vec3) {
      _translation = vec3.clone(t);
      updateMatrix();
    },
    get translation() {
      return _translation;
    },

    set rotation(r: any) {
      _rotation = {
        angle: r.angle,
        axis: vec3.clone(r.axis),
      };
      updateMatrix();
    },
    get rotation() {
      return _rotation;
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

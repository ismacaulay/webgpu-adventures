import { mat4, vec3 } from 'gl-matrix';
import { CameraType, OrthographicCamera, PerspectiveCamera } from '../types/camera';

interface PerspectiveCameraParams {
  fov: number;
  znear: number;
  zfar: number;
  aspect: number;
}

export function createPerspectiveCamera(params: PerspectiveCameraParams): PerspectiveCamera {
  const _target = vec3.fromValues(0, 0, 0);
  const _position = vec3.fromValues(0, 0, 0);
  const _up = vec3.fromValues(0, 1, 0);

  const fov = params.fov;
  const znear = params.znear;
  const zfar = params.zfar;
  let aspect = params.aspect;

  const view = mat4.create();
  const projection = mat4.create();

  function lookat(eye: vec3, target: vec3, up: vec3) {
    vec3.copy(_position, eye);
    vec3.copy(_target, target);
    vec3.copy(_up, up);

    mat4.lookAt(view, eye, target, up);
  }

  function updateViewMatrix() {
    lookat(_position, _target, _up);
  }

  function updateProjectionMatrix() {
    mat4.perspectiveZO(projection, (fov * Math.PI) / 180.0, aspect, znear, zfar);
  }

  updateViewMatrix();
  updateProjectionMatrix();

  return {
    type: CameraType.Perspective,

    view,
    projection,

    fov,
    znear,
    zfar,

    get aspect() {
      return aspect;
    },
    set aspect(value: number) {
      aspect = value;
    },

    get position() {
      return _position;
    },
    get target() {
      return _target;
    },
    get up() {
      return _up;
    },

    lookat,
    updateViewMatrix,
    updateProjectionMatrix,
  };
}

interface OrthographicCameraParams {
  aspect: number;

  left: number;
  right: number;
  top: number;
  bottom: number;

  znear: number;
  zfar: number;
}

export function createOrthographicCamera(params: OrthographicCameraParams): OrthographicCamera {
  const _target = vec3.fromValues(0, 0, 0);
  const _position = vec3.fromValues(0, 0, 0);
  const _up = vec3.fromValues(0, 1, 0);

  const left = params.left;
  const right = params.right;
  const top = params.top;
  const bottom = params.bottom;
  let zoom = 1;

  const znear = params.znear;
  const zfar = params.zfar;
  let aspect = params.aspect;

  const view = mat4.create();
  const projection = mat4.create();

  function lookat(eye: vec3, target: vec3, up: vec3) {
    vec3.copy(_position, eye);
    vec3.copy(_target, target);
    vec3.copy(_up, up);

    mat4.lookAt(view, eye, target, up);
  }

  function updateViewMatrix() {
    lookat(_position, _target, _up);
  }

  function updateProjectionMatrix() {
    const dx = (right - left) / (2 * zoom);
    const dy = (top - bottom) / (2 * zoom);
    const cx = (right + left) / 2;
    const cy = (top + bottom) / 2;

    mat4.orthoZO(projection, (cx - dx) * aspect, (cx + dx) * aspect, cy - dy, cy + dy, znear, zfar);
  }

  updateViewMatrix();
  updateProjectionMatrix();

  return {
    type: CameraType.Orthographic,

    view,
    projection,

    get aspect() {
      return aspect;
    },
    set aspect(value: number) {
      aspect = value;
    },
    znear,
    zfar,

    get position() {
      return _position;
    },
    get target() {
      return _target;
    },
    get up() {
      return _up;
    },

    left,
    right,
    top,
    bottom,
    get zoom() {
      return zoom;
    },
    set zoom(value: number) {
      zoom = value;
    },

    lookat,
    updateViewMatrix,
    updateProjectionMatrix,
  };
}

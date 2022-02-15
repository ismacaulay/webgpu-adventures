import { vec3 } from 'gl-matrix';
import { createOrthographicCamera, createPerspectiveCamera } from './camera';
import { CameraType, Camera, CameraController } from 'toolkit/types/camera';
import { createOrbitControls } from './orbit-controls';

export function createCameraController(element: HTMLElement): CameraController {
  // TODO: this should be set outside
  const zoom = 1;
  const position: [number, number, number] = [0, 0, 4];

  const perspectiveCamera = createPerspectiveCamera({
    fov: 45,
    znear: 0.1,
    zfar: 2000,
    aspect: element.clientWidth / element.clientHeight,
  });
  vec3.set(perspectiveCamera.position, ...position);
  perspectiveCamera.updateViewMatrix();

  // TODO: set z planes dynamically
  const orthographicCamera = createOrthographicCamera({
    aspect: element.clientWidth / element.clientHeight,
    znear: -2000,
    zfar: 2000,
    top: 2.5,
    bottom: -2.5,
    left: -2.5,
    right: 2.5,
  });
  vec3.set(orthographicCamera.position, ...position);
  orthographicCamera.zoom = zoom;
  orthographicCamera.updateViewMatrix();

  let camera: Camera = orthographicCamera;

  // TODO: specify controls type
  const controls = createOrbitControls(element, { camera });

  return {
    get camera() {
      return camera;
    },

    get activeCamera() {
      return camera.type;
    },
    set activeCamera(value: CameraType) {
      // TODO: sync the zoom (probably need a radius value)
      if (value === CameraType.Perspective) {
        vec3.copy(perspectiveCamera.position, camera.position);
        vec3.copy(perspectiveCamera.target, camera.target);
        vec3.copy(perspectiveCamera.up, camera.up);
        perspectiveCamera.updateViewMatrix();

        camera = perspectiveCamera;
      } else {
        vec3.copy(orthographicCamera.position, camera.position);
        vec3.copy(orthographicCamera.target, camera.target);
        vec3.copy(orthographicCamera.up, camera.up);
        orthographicCamera.updateViewMatrix();

        camera = orthographicCamera;
      }
      controls.camera = camera;
    },

    update() {
      controls.update();
    },

    resize(width: number, height: number) {
      perspectiveCamera.aspect = width / height;
      perspectiveCamera.updateProjectionMatrix();

      orthographicCamera.aspect = width / height;
      orthographicCamera.updateProjectionMatrix();
    },

    destroy() {
      controls.destroy();
    },
  };
}

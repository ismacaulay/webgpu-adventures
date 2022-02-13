import { quat, vec2, vec3 } from 'gl-matrix';
import { Camera, CameraType } from './types';

enum State {
  None,
  Rotate,
  Pan,
  Dolly,
}

enum MouseButton {
  Left = 0,
  Right = 2,
  Middle = 1,
}

export function createOrbitControls(element: HTMLElement, initialState: { camera: Camera }) {
  let state = State.None;
  let camera: Camera = initialState.camera;

  const viewRight = vec3.create();
  const viewUp = vec3.create();

  const rotateStart = vec2.create();
  const rotateEnd = vec2.create();
  const rotateDelta = vec2.create();
  const rotateScale = 1.0;

  const panStart = vec2.create();
  const panEnd = vec2.create();
  const panDelta = vec3.create();
  const panRight = vec3.create();
  const panUp = vec3.create();
  const panDistance = vec2.create();

  const dollyScale = 0.95;
  let scale = 1.0;

  function handleMouseDown(e: MouseEvent) {
    if (e.button === MouseButton.Left) {
      state = State.Rotate;
      vec2.set(rotateStart, e.clientX, e.clientY);
    } else if (e.button === MouseButton.Middle) {
      state = State.Pan;
      vec2.set(panStart, e.clientX, e.clientY);
    }
  }

  const tmpOffset = vec3.create();
  function handleMouseMove(e: MouseEvent) {
    if (state === State.Rotate) {
      // update the end rotate
      vec2.set(rotateEnd, e.clientX, e.clientY);

      const deltaX = rotateEnd[0] - rotateStart[0];
      const deltaY = rotateEnd[1] - rotateStart[1];

      rotateDelta[0] -= 2 * Math.PI * (deltaX / element.clientWidth) * rotateScale;
      rotateDelta[1] -= 2 * Math.PI * (deltaY / element.clientHeight) * rotateScale;

      // copy the end to start for the next update
      vec2.copy(rotateStart, rotateEnd);
    } else if (state === State.Pan) {
      vec2.set(panEnd, e.clientX, e.clientY);

      const deltaX = panEnd[0] - panStart[0];
      const deltaY = panEnd[1] - panStart[1];

      // the right vector is the first column of the view matrix (mat4 is column major)
      vec3.set(viewRight, camera.view[0], camera.view[4], camera.view[8]);
      // the up vector is the second column of the view matrix (mat4 is column major)
      vec3.set(viewUp, camera.view[1], camera.view[5], camera.view[9]);

      if (camera.type === CameraType.Perspective) {
        vec3.subtract(tmpOffset, camera.position, camera.target);
        const targetDistance =
          vec3.length(tmpOffset) * Math.tan(((camera.fov / 2.0) * Math.PI) / 180.0);

        // multiply the distance by the right vector; the distance is how far the mouse has
        // moved in the view frustum. We use heigh for the x since this is vertical fov
        panDistance[0] = -2.0 * targetDistance * (deltaX / element.clientHeight);
        panDistance[1] = 2.0 * targetDistance * (deltaY / element.clientHeight);
      } else {
        // compute the pan distances based on the frustum and screen size
        panDistance[0] =
          (-deltaX * (camera.right - camera.left)) / camera.zoom / element.clientWidth;
        panDistance[1] =
          (deltaY * (camera.top - camera.bottom)) / camera.zoom / element.clientHeight;
      }

      // compute the right and up vector
      vec3.scale(panRight, viewRight, panDistance[0]);
      vec3.scale(panUp, viewUp, panDistance[1]);

      // comput the delta vector
      vec3.add(panDelta, panDelta, panRight);
      vec3.add(panDelta, panDelta, panUp);

      // set the start to the end
      vec2.copy(panStart, panEnd);
    }
  }

  function handlePointerDown(e: PointerEvent) {
    document.addEventListener('pointerup', handlePointerUp, true);
    document.addEventListener('pointermove', handlePointerMove, true);

    if (e.pointerType === 'mouse') {
      handleMouseDown(e);
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (e.pointerType === 'mouse') {
      handleMouseMove(e);
    }
  }

  function handlePointerUp(e: PointerEvent) {
    document.removeEventListener('pointerup', handlePointerUp, true);
    document.removeEventListener('pointermove', handlePointerMove, true);

    state = State.None;
  }

  function handleMouseWheel(e: WheelEvent) {
    // perspective camera can be moved (dolly) closer/further to be zoon
    if (camera.type === CameraType.Perspective) {
      if (e.deltaY < 0) {
        scale *= dollyScale;
      } else {
        scale /= dollyScale;
      }
    } else {
      if (e.deltaY < 0) {
        camera.zoom = camera.zoom / dollyScale;
      } else {
        camera.zoom = camera.zoom * dollyScale;
      }
      camera.updateProjectionMatrix();
    }
  }

  element.addEventListener('pointerdown', handlePointerDown, true);
  element.addEventListener('wheel', handleMouseWheel, true);

  const q = quat.create();
  const invQ = quat.create();
  const offset = vec3.create();
  const yUp = vec3.fromValues(0, 1, 0);
  const target = vec3.create();
  const position = vec3.create();
  let theta = 0;
  let phi = 0;
  let radius = 0;

  function update() {
    quat.rotationTo(q, camera.up, yUp);
    quat.invert(invQ, q);

    // compute camera offset to the target
    vec3.subtract(offset, camera.position, camera.target);
    vec3.transformQuat(offset, offset, q);

    // update the camera target with the pan delta
    vec3.add(target, camera.target, panDelta);

    // update position
    // compute the spherical coords of the offset
    radius = vec3.len(offset) * scale;
    theta = Math.atan2(offset[0], offset[2]);
    phi = Math.atan2(Math.sqrt(offset[0] * offset[0] + offset[2] * offset[2]), offset[1]);
    // phi = Math.acos(Math.max(Math.min(offset[1] / radius, 1), -1));

    // add the rotation delta
    theta += rotateDelta[0];
    phi += rotateDelta[1];
    phi = Math.max(Math.min(phi, Math.PI - 1e-6), 1e-6);

    // convert the spherical back to a vector
    vec3.set(
      offset,
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta),
    );

    // transform the offset back
    vec3.transformQuat(offset, offset, invQ);

    // set the new camera position
    vec3.add(position, target, offset);

    // update view matrix
    camera.lookat(position, target, camera.up);

    // reset deltas
    vec2.set(rotateDelta, 0, 0);
    vec3.set(panDelta, 0, 0, 0);
    scale = 1.0;
  }

  return {
    update,

    set camera(value: Camera) {
      camera = value;
    },

    destroy() {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('wheel', handleMouseWheel, true);
    },
  };
}

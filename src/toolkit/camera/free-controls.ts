import { vec3 } from 'gl-matrix';
import { radians } from 'toolkit/math';
import type { Camera } from 'toolkit/types/camera';

const W_KEY_BIT = 1 << 1;
const A_KEY_BIT = 1 << 2;
const S_KEY_BIT = 1 << 3;
const D_KEY_BIT = 1 << 4;
const C_KEY_BIT = 1 << 5;
const SPACE_KEY_BIT = 1 << 6;

function directionValue(keys: number, negBit: number, posBit: number) {
  return (!!(keys & posBit) ? 1 : 0) + (!!(keys & negBit) ? -1 : 0);
}

export function createFreeControls(
  canvas: HTMLElement,
  camera: Camera,
  options: {
    mouseSensitivity: number;
    moveSensitivity: number;
  } = {
    mouseSensitivity: 0.1,
    moveSensitivity: 2.5,
  },
) {
  const { mouseSensitivity, moveSensitivity } = options;

  let keys = 0;
  let locked = false;
  function onClick() {
    if (locked) return;

    canvas.requestPointerLock();
    keys = 0;
  }

  function onPointerLockChanged() {
    if (document.pointerLockElement === canvas) {
      locked = true;
    } else {
      locked = false;
    }
  }

  function onPointerLockError() {
    console.warn('Pointer lock error!');
  }

  function onKeyDown(evt: KeyboardEvent) {
    switch (evt.keyCode) {
      // W
      case 87:
        keys |= W_KEY_BIT;
        break;
      // A
      case 65:
        keys |= A_KEY_BIT;
        break;
      // S
      case 83:
        keys |= S_KEY_BIT;
        break;
      // D
      case 68:
        keys |= D_KEY_BIT;
        break;
      // C
      case 67:
        keys |= C_KEY_BIT;
        break;
      // space
      case 32:
        keys |= SPACE_KEY_BIT;
        break;
    }
  }

  function onKeyUp(evt: KeyboardEvent) {
    switch (evt.keyCode) {
      // W
      case 87:
        keys &= ~W_KEY_BIT;
        break;
      // A
      case 65:
        keys &= ~A_KEY_BIT;
        break;
      // S
      case 83:
        keys &= ~S_KEY_BIT;
        break;
      // D
      case 68:
        keys &= ~D_KEY_BIT;
        break;
      // C
      case 67:
        keys &= ~C_KEY_BIT;
        break;
      // space
      case 32:
        keys &= ~SPACE_KEY_BIT;
        break;
    }
  }

  let yaw = -90;
  let pitch = 0;
  const front = vec3.create();
  const right = vec3.create();
  const worldUp = vec3.fromValues(0, 1, 0);

  function updateCamera() {
    vec3.normalize(
      front,
      vec3.set(
        front,
        Math.cos(radians(yaw)) * Math.cos(radians(pitch)),
        Math.sin(radians(pitch)),
        Math.sin(radians(yaw)) * Math.cos(radians(pitch)),
      ),
    );

    vec3.normalize(right, vec3.cross(right, front, worldUp));

    vec3.cross(camera.up, right, front);
    vec3.add(camera.target, camera.position, front);
    camera.updateViewMatrix();
  }

  function onMouseMove(evt: MouseEvent) {
    if (!locked) return;

    yaw += evt.movementX * mouseSensitivity;
    pitch += -evt.movementY * mouseSensitivity;

    if (pitch > 89.0) pitch = 89.0;
    if (pitch < -89.0) pitch = -89.0;

    updateCamera();
  }

  canvas.addEventListener('mousedown', onClick, false);
  document.addEventListener('pointerlockchange', onPointerLockChanged, false);
  document.addEventListener('pointerlockerror', onPointerLockError, false);
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  document.addEventListener('mousemove', onMouseMove, false);

  const _front = vec3.create();
  const _right = vec3.create();
  const _up = vec3.create();
  const dir = vec3.create();

  return {
    update(dt: number) {
      if (!locked) return;

      vec3.scale(_front, front, dt * directionValue(keys, S_KEY_BIT, W_KEY_BIT) * moveSensitivity);

      vec3.scale(_right, right, dt * directionValue(keys, A_KEY_BIT, D_KEY_BIT) * moveSensitivity);

      vec3.scale(
        _up,
        camera.up,
        dt * directionValue(keys, C_KEY_BIT, SPACE_KEY_BIT) * moveSensitivity,
      );

      vec3.add(dir, _up, vec3.add(dir, _front, _right));
      vec3.add(camera.position, camera.position, dir);

      updateCamera();
    },
    destroy() {
      document.removeEventListener('keydown', onKeyDown, false);
      document.removeEventListener('keyup', onKeyUp, false);
      document.removeEventListener('mousemove', onMouseMove, false);
      document.removeEventListener('pointerlockchange', onPointerLockChanged, false);
      document.removeEventListener('pointerlockerror', onPointerLockError, false);

      canvas.removeEventListener('click', onClick, false);
    },
  };
}

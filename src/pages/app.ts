import { vec3 } from 'gl-matrix';
import { createCameraController } from 'toolkit/camera/camera-controller';
import {
  createBufferManager,
  createEntityManager,
  createShaderManager,
  createTextureManager,
} from 'toolkit/ecs';
import { createRenderSystem } from 'toolkit/ecs/systems';
import type { CameraController, CameraControls } from 'toolkit/types/camera';
import { createRenderer } from 'toolkit/webgpu/renderer';
import { createScriptSystem } from 'toolkit/ecs/systems/script';
import type {
  BufferManager,
  EntityManager,
  ShaderManager,
  TextureManager,
} from 'toolkit/types/ecs/managers';
import { createMovementSystem } from 'toolkit/ecs/systems/movement';
import type { RenderSystem } from 'toolkit/types/ecs/systems';

export interface Application {
  entityManager: EntityManager;
  bufferManager: BufferManager;
  textureManager: TextureManager;
  shaderManager: ShaderManager;
  cameraController: CameraController;

  renderSystem: RenderSystem;

  start(): void;
  destroy(): void;

  onRenderBegin(cb: () => void): void;
  onRenderEnd(cb: () => void): void;
}

export async function createApp(
  canvas: HTMLCanvasElement,
  initial?: {
    camera?: {
      controls?: CameraControls;
      position?: [number, number, number];
    };
  },
): Promise<Application> {
  const renderer = await createRenderer(canvas);

  const cameraController = createCameraController(canvas, initial?.camera);
  const camera = cameraController.camera;
  vec3.set(camera.position, ...(initial?.camera?.position ?? [0, 0, 5]));
  camera.updateViewMatrix();

  const entityManager = createEntityManager();
  const bufferManager = createBufferManager(renderer.device);
  const textureManager = createTextureManager(renderer.device);
  const shaderManager = createShaderManager(renderer.device, {
    bufferManager,
    textureManager,
  });

  const scriptSystem = createScriptSystem(entityManager);
  const renderSystem = createRenderSystem(renderer, cameraController, {
    entityManager,
    shaderManager,
    bufferManager,
  });
  const movementSystem = createMovementSystem(entityManager);

  function handleClick(evt: PointerEvent) {
    renderer.pick(evt.clientX, evt.clientY).then(() => {
      console.log('done pick');
    });
  }
  canvas.addEventListener('click', handleClick, false);

  let rafId: number;
  let lastTime = performance.now();
  let _onRenderBegin = () => {};
  let _onRenderEnd = () => {};
  function render() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    _onRenderBegin();

    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    cameraController.update(dt);

    scriptSystem.update(dt);
    movementSystem.update(dt);
    renderSystem.update();

    _onRenderEnd();
    rafId = requestAnimationFrame(render);
  }

  return {
    entityManager,
    bufferManager,
    textureManager,
    shaderManager,

    cameraController,

    renderSystem,

    start() {
      render();
    },

    destroy() {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      shaderManager.destroy();
      textureManager.destroy();
      bufferManager.destroy();
      entityManager.destroy();

      renderer.destroy();
      cameraController.destroy();

      canvas.removeEventListener('click', handleClick, false);
    },

    onRenderBegin(cb) {
      _onRenderBegin = cb;
    },
    onRenderEnd(cb) {
      _onRenderEnd = cb;
    },
  };
}

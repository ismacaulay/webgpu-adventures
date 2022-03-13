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
import { createEventController } from 'toolkit/events/event-controller';
import type { EventController } from 'toolkit/types/events';
import { createSelectionController } from 'toolkit/webgpu/selection-controller';
import { noop } from 'svelte/internal';
import type { SelectionController } from 'toolkit/types/events/selection';

export interface Application {
  entityManager: EntityManager;
  bufferManager: BufferManager;
  textureManager: TextureManager;
  shaderManager: ShaderManager;

  eventController: EventController;
  cameraController: CameraController;
  selectionController: SelectionController;

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

  const eventController = createEventController(canvas);

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

  const selectionController = createSelectionController({
    eventController,
    entityManager,
    shaderManager,
    renderer,
  });

  let rafId: number;
  let lastTime = performance.now();
  let _onRenderBegin = noop;
  let _onRenderEnd = noop;
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

  const app = {
    entityManager,
    bufferManager,
    textureManager,
    shaderManager,

    eventController,
    cameraController,
    selectionController,

    renderSystem,

    start() {
      render();
    },

    destroy() {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      selectionController.destroy();

      shaderManager.destroy();
      textureManager.destroy();
      bufferManager.destroy();
      entityManager.destroy();

      renderer.destroy();
      cameraController.destroy();
    },

    onRenderBegin(cb: any) {
      _onRenderBegin = cb;
    },
    onRenderEnd(cb: any) {
      _onRenderEnd = cb;
    },
  };

  (window as any).app = app;
  return app;
}

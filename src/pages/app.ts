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
import type { RenderSystem, ScriptSystem } from 'toolkit/types/ecs/systems';

export interface Application {
  entityManager: EntityManager;
  bufferManager: BufferManager;
  textureManager: TextureManager;
  shaderManager: ShaderManager;
  renderSystem: RenderSystem;
  scriptSystem: ScriptSystem;
  cameraController: CameraController;
  start(): void;
  destroy(): void;
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

  let rafId: number;
  let lastTime = performance.now();
  function render() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    cameraController.update(dt);

    scriptSystem.update(dt);
    renderSystem.update();

    rafId = requestAnimationFrame(render);
  }

  return {
    entityManager,
    bufferManager,
    textureManager,
    shaderManager,
    renderSystem,
    scriptSystem,
    cameraController,

    start() {
      render();
    },

    destroy() {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      shaderManager.destroy();
      bufferManager.destroy();
      entityManager.destroy();

      renderer.destroy();
      cameraController.destroy();
    },
  };
}

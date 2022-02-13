import {
  ShaderBinding,
  createShader,
  cloneShader,
  Shader,
  ShaderDescriptor,
} from 'toolkit/webgpu/shaders';

export interface ShaderManager {
  get(id: number): Shader;
  create(descriptor: ShaderDescriptor): number;
  destroy(): void;
}

interface ShaderStorage {
  [key: number]: Shader;
}

export async function createShaderManager(device: GPUDevice) {
  let storage: ShaderStorage = {};

  let storageId = 0;
  let shaderId = 0;

  return {
    get(id: number) {
      let shader = storage[id];
      if (!shader) {
        throw new Error(`Unknown shader: ${id}`);
      }

      return shader;
    },

    create({ vertex, fragment, bindings }: ShaderDescriptor) {
      const shader = createShader(device, glslang, {
        id: shaderId,
        vertex,
        fragment,
        bindings,
      });
      shaderId++;

      const id = storageId;
      storageId++;
      storage[id] = shader;
      return id;
    },

    clone(id: number, bindings: ShaderBinding[]) {
      const shader = storage[id];
      if (!shader) {
        throw new Error(`Unknown shader: ${id}`);
      }

      const next = storageId;
      storageId++;
      storage[next] = cloneShader(device, shader, bindings);
      return next;
    },

    destroy() {
      storage = {};
    },
  };
}

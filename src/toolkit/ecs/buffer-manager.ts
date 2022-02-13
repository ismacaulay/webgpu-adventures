import {
  BufferAttribute,
  createVertexBuffer as createWebGPUVertexBuffer,
  Buffer,
  createUniformBuffer,
  UniformBufferDescriptor,
  UniformType,
  UniformDictionary,
} from 'toolkit/webgpu/buffers';
import { createIdProvider } from './id-provider';

export interface VertexBufferInfo {
  id?: number;
  attributes: BufferAttribute[];
  array: Float32Array;
}

export interface BufferManager {
  createVertexBuffer(info: VertexBufferInfo): number;
  createUniformBuffer(uniforms: UniformBufferDescriptor, initial?: UniformDictionary): number;

  get<T extends Buffer>(id: number): T;
  destroy(): void;
}

export enum DefaultBuffers {
  ViewProjection = 0,

  Count,
}

interface BufferStorage {
  [key: number]: Buffer;
}

export function createBufferManager(device: GPUDevice): BufferManager {
  let storage: BufferStorage = {};
  const generator = createIdProvider(DefaultBuffers.Count);

  return {
    createVertexBuffer(info: VertexBufferInfo) {
      const id = generator.next();
      storage[id] = createWebGPUVertexBuffer(device, info.attributes, info.array);
      return id;
    },

    createUniformBuffer(uniforms: UniformBufferDescriptor, initial?: UniformDictionary) {
      const id = generator.next();
      storage[id] = createUniformBuffer(device, uniforms, initial);
      return id;
    },

    get<T extends Buffer>(id: number): T {
      let buffer = storage[id];

      if (!buffer) {
        if (id === DefaultBuffers.ViewProjection) {
          buffer = createUniformBuffer(device, {
            view: UniformType.Mat4,
            projection: UniformType.Mat4,
          });
          storage[id] = buffer;
        } else {
          throw new Error(`Unknown buffer: ${id}`);
        }
      }

      return buffer as T;
    },

    destroy() {
      Object.values(storage).forEach((buffer: Buffer) => {
        buffer.destroy();
      });
      storage = {};
    },
  };
}

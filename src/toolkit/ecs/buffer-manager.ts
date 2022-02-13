import {
  createVertexBuffer,
  BaseBuffer,
  createUniformBuffer,
  UniformBufferDescriptor,
  UniformType,
  UniformDictionary,
  IndexBufferDescriptor,
  VertexBufferDescriptor,
} from 'toolkit/webgpu/buffers';
import { createIndexBuffer } from 'toolkit/webgpu/buffers/index-buffer';
import { createIdProvider } from './id-provider';

export interface BufferManager {
  createVertexBuffer(info: VertexBufferDescriptor): number;
  createUniformBuffer(uniforms: UniformBufferDescriptor, initial?: UniformDictionary): number;
  createIndexBuffer(descriptor: IndexBufferDescriptor): number;

  get<T extends BaseBuffer>(id: number): T;
  destroy(): void;
}

export enum DefaultBuffers {
  ViewProjection = 0,

  Count,
}

interface BufferStorage {
  [key: number]: BaseBuffer;
}

export function createBufferManager(device: GPUDevice): BufferManager {
  let storage: BufferStorage = {};
  const generator = createIdProvider(DefaultBuffers.Count);

  return {
    createVertexBuffer(info: VertexBufferDescriptor) {
      const id = generator.next();
      storage[id] = createVertexBuffer(device, info.attributes, info.array);
      return id;
    },

    createUniformBuffer(uniforms: UniformBufferDescriptor, initial?: UniformDictionary) {
      const id = generator.next();
      storage[id] = createUniformBuffer(device, uniforms, initial);
      return id;
    },

    createIndexBuffer(descriptor: IndexBufferDescriptor) {
      const id = generator.next();
      storage[id] = createIndexBuffer(device, descriptor);
      return id;
    },

    get<T extends BaseBuffer>(id: number): T {
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
      Object.values(storage).forEach((buffer: BaseBuffer) => {
        buffer.destroy();
      });
      storage = {};
    },
  };
}

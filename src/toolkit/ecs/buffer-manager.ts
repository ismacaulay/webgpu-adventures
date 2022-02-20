import { BufferManager, DefaultBuffers } from 'toolkit/types/ecs/managers';
import type { Storage } from 'toolkit/types/generic';
import {
  Buffer,
  IndexBufferDescriptor,
  UniformBufferDescriptor,
  UniformDictionary,
  UniformType,
  VertexBufferDescriptor,
} from 'toolkit/types/webgpu/buffers';
import { createIndexBuffer, createUniformBuffer, createVertexBuffer } from 'toolkit/webgpu/buffers';

export function createBufferManager(device: GPUDevice): BufferManager {
  let storage: Storage<Buffer> = {};
  let next = DefaultBuffers.Count;

  return {
    createVertexBuffer(descriptor: VertexBufferDescriptor) {
      storage[next] = createVertexBuffer(device, descriptor);
      return next++;
    },

    createUniformBuffer(descriptor: UniformBufferDescriptor, initial?: UniformDictionary) {
      storage[next] = createUniformBuffer(device, descriptor, initial);
      return next++;
    },

    createIndexBuffer(descriptor: IndexBufferDescriptor) {
      storage[next] = createIndexBuffer(device, descriptor);
      return next++;
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
      Object.values(storage).forEach((buf: Buffer) => buf.destroy());
      storage = {};
    },
  };
}

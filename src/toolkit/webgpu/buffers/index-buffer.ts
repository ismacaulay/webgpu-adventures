import { BufferType, IndexBuffer, IndexBufferDescriptor } from 'toolkit/types/webgpu/buffers';
import { createBuffer } from '../utils';

export function createIndexBuffer(
  device: GPUDevice,
  descriptor: IndexBufferDescriptor,
): IndexBuffer {
  const format: GPUIndexFormat = descriptor.array instanceof Uint16Array ? 'uint16' : 'uint32';
  const data = descriptor.array;
  const buffer = createBuffer(device, data, GPUBufferUsage.INDEX);

  return {
    type: BufferType.Index,

    buffer,
    data,
    format,

    destroy() {
      buffer.destroy();
    },
  };
}

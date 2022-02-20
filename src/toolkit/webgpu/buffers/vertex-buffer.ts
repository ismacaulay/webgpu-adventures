import {
  BufferAttributeFormat,
  BufferType,
  VertexBuffer,
  VertexBufferDescriptor,
} from 'toolkit/types/webgpu/buffers';
import { createBuffer } from '../utils';

function getStrideForFormat(type: BufferAttributeFormat) {
  switch (type) {
    case BufferAttributeFormat.Float32:
      return 4;
    case BufferAttributeFormat.Float32x2:
      return 4 * 2;
    case BufferAttributeFormat.Float32x3:
      return 4 * 3;
  }
}

export function createVertexBuffer(
  device: GPUDevice,
  { array, attributes }: VertexBufferDescriptor,
): VertexBuffer {
  let data: Float32Array;
  if (array instanceof Float64Array) {
    data = new Float32Array(array);
  } else {
    data = array;
  }
  const buffer = createBuffer(device, data, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);

  const attrs: GPUVertexAttribute[] = [];
  let offset = 0;
  for (let i = 0; i < attributes.length; ++i) {
    const { location, format } = attributes[i];
    attrs.push({
      shaderLocation: location,
      format,
      offset,
    });

    offset += getStrideForFormat(format);
  }

  return {
    type: BufferType.Vertex,

    buffer,
    data,
    layout: {
      arrayStride: offset,
      attributes: attrs,
    },

    destroy() {
      buffer.destroy();
    },
  };
}

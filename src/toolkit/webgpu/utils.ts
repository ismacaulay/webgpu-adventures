import type { VertexBuffer } from 'toolkit/types/webgpu/buffers';
import type { Shader } from 'toolkit/types/webgpu/shaders';

export function isWebGPUSupported() {
  return navigator && (navigator as any).gpu !== undefined;
}

export function createBuffer(
  device: GPUDevice,
  src: Float32Array | Uint16Array | Uint32Array,
  usage: number,
): GPUBuffer {
  // create a buffer
  const buffer = device.createBuffer({
    size: src.byteLength,
    usage,
    mappedAtCreation: true,
  });

  // write the data to the mapped buffer
  new (src as any).constructor(buffer.getMappedRange()).set(src);

  // unmap the buffer before submitting it to the queue
  buffer.unmap();

  return buffer;
}

export function createPipeline(
  device: GPUDevice,
  presentationFormat: GPUTextureFormat,
  shader: Shader,
  buffers: VertexBuffer[],
) {
  return device.createRenderPipeline({
    vertex: {
      ...shader.vertex,
      buffers: buffers.map((b: VertexBuffer) => b.layout),
    },
    fragment: {
      ...shader.fragment,
      targets: [
        {
          format: presentationFormat,
          blend: shader.blend,
        },
      ],
    },

    primitive: {
      topology: 'triangle-list',
      cullMode: 'none',
    },

    depthStencil: {
      depthWriteEnabled: shader.depthWrite,
      depthCompare: shader.depthFunc,
      format: 'depth24plus-stencil8',

      stencilFront: shader.stencilFront,
      stencilBack: shader.stencilBack,
      stencilWriteMask: shader.stencilWriteMask,
      stencilReadMask: shader.stencilReadMask,
    },

    multisample: {
      count: 4,
    },
  });
}

export function createBindGroups(
  device: GPUDevice,
  pipeline: GPUPipelineBase,
  shader: Shader,
): GPUBindGroup[] {
  return shader.bindings.map((groupDescriptors, idx) => {
    return device.createBindGroup({
      layout: pipeline.getBindGroupLayout(idx),
      entries: groupDescriptors.entries.map((entry, idx) => {
        return {
          binding: idx,
          resource: entry.resource,
        };
      }),
    });
  });
}

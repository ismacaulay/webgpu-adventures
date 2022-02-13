import { VertexBuffer } from './buffers';

export function createMeshRenderer(device: GPUDevice, shader: any, vertexBuffer: VertexBuffer) {
  const layout: GPUPipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [shader.bindGroupLayout],
  });

  const pipeline: GPURenderPipeline = device.createRenderPipeline({
    layout: layout,

    ...shader.stages,

    primitiveTopology: 'triangle-list',
    colorStates: [
      {
        format: 'bgra8unorm',
        alphaBlend: {
          srcFactor: 'src-alpha',
          dstFactor: 'one-minus-src-alpha',
          operation: 'add',
        },
        colorBlend: {
          srcFactor: 'src-alpha',
          dstFactor: 'one-minus-src-alpha',
          operation: 'add',
        },
        writeMask: GPUColorWrite.ALL,
      },
    ],

    depthStencilState: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus-stencil8',
    },

    vertexState: {
      indexFormat: 'uint16',
      vertexBuffers: [vertexBuffer.descriptor],
    },
    rasterizationState: {
      frontFace: 'ccw',
      cullMode: 'none',
    },
  });

  return {
    render(encoder: GPURenderPassEncoder) {
      encoder.setPipeline(pipeline);
      encoder.setBindGroup(0, shader.bindGroup);
      encoder.setVertexBuffer(0, vertexBuffer.buffer);
      encoder.draw(vertexBuffer.count, 1, 0, 0);
    },
  };
}

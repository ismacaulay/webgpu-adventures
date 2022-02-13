/*
 * This is a simple WebGPU example that renders a triangle onto the canvas
 * It is extremely verbose so that all of the typing information can be specified
 * for every step of building the rendering pipeline.
 */
import shaderSource from './triangle.wgsl';

export function createBuffer(device: GPUDevice, src: Float32Array | Uint32Array, usage: number) {
  // create a buffer
  //  the simplest way is to create a mapped buffer, then write the array to the mapping
  //  you can also create a buffer, then request the mapping afterwards (not sure how to yet)
  //  finally, you can use copyBufferToBuffer to copy the data from one buffer to another
  const buffer = device.createBuffer({ size: src.byteLength, usage, mappedAtCreation: true });
  // write the data to the mapped buffer
  new (src as any).constructor(buffer.getMappedRange()).set(src);
  // the buffer needs to be unmapped before it can be submitted to the queue
  buffer.unmap();
  return buffer;
}

export async function createTriangleRenderer(canvas: HTMLCanvasElement) {
  // check if webgpu is supported
  const gpu: GPU | undefined = navigator.gpu;
  if (!gpu) {
    // TODO: Should put a message on the page if it is not supported
    throw new Error('WebGPU not supported in this browser');
  }

  // request a physical device adapter
  //      an adapter describes the phycical properties fo a given GPU
  //      such as name, extensions, device limits...
  const adapter: GPUAdapter | null = await gpu.requestAdapter();
  if (!adapter) {
    throw new Error('Unable to request adapter');
  }
  // request a device
  //      a device is how you access the core of the webgpu api
  const device: GPUDevice = await adapter.requestDevice();

  // setup the context
  const context: GPUCanvasContext = canvas.getContext('webgpu') as GPUCanvasContext;
  if (!context) {
    throw new Error('Unable to get webgpu context');
  }

  const devicePixelRatio = window.devicePixelRatio || 1;
  let presentationSize = [
    canvas.clientWidth * devicePixelRatio,
    canvas.clientHeight * devicePixelRatio,
  ];
  const presentationFormat = context.getPreferredFormat(adapter);
  context.configure({
    device,
    size: presentationSize,
    format: presentationFormat,
  });

  // setup the render target
  let renderTarget = device.createTexture({
    size: presentationSize,
    format: presentationFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
  let renderTargetView = renderTarget.createView();

  // create vertex/index buffers
  // prettier-ignore
  const positions = new Float32Array([
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        0.0, 1.0, 0.0,
    ]);
  const positionBuffer = createBuffer(device, positions, GPUBufferUsage.VERTEX);

  // prettier-ignore
  const colors = new Float32Array([
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0,
    ]);
  const colorBuffer = createBuffer(device, colors, GPUBufferUsage.VERTEX);

  const indices = new Uint32Array([0, 1, 2]);
  const indexBuffer = createBuffer(device, indices, GPUBufferUsage.INDEX);
  const indexFormat = 'uint32';

  // load the shader modules
  const shaderModule: GPUShaderModule = device.createShaderModule({
    code: shaderSource,
  });

  // create a uniform buffer
  // prettier-ignore
  const uniforms = new Float32Array([
        //  ModelViewProjection Matrix
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);
  const uniformBuffer: GPUBuffer = createBuffer(device, uniforms, GPUBufferUsage.UNIFORM);

  // create a pipeline layout to describe where the uniform will be when executing a graphics pipeline
  //
  // a GPUBindGroupLayout defines the interface between a set of resource bound in the GPUBindGroup and
  // their accessibility in shader stages. A GPUBindGroupLayoutEntry describes a single shader resource
  // binding to be included in a GPUBindGroupLayout
  const uniformBindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX, // specify the stage which has access to the binding
        buffer: {
          type: 'uniform',
        },
      },
    ],
  });
  // a GPUBindGroup defines a set of resources to be bound together in a group and how the resources
  // how the resources are used in shader stages
  const uniformBindGroup: GPUBindGroup = device.createBindGroup({
    layout: uniformBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
  });

  const layout: GPUPipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [uniformBindGroupLayout],
  });

  // graphics pipeline
  //      this describes all the data that is to be fed into the execture of a raster
  //      based graphics pipeline.
  const pipeline: GPURenderPipeline = device.createRenderPipeline({
    vertex: {
      module: shaderModule,
      entryPoint: 'vertex_main',
      buffers: [
        {
          arrayStride: 3 * 4,
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: 'float32x3',
            },
          ],
        },
        {
          arrayStride: 3 * 4,
          attributes: [
            {
              shaderLocation: 1,
              offset: 0,
              format: 'float32x3',
            },
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragment_main',
      targets: [
        {
          format: presentationFormat,
        },
      ],
    },

    primitive: {
      topology: 'triangle-list',
      cullMode: 'none',
    },

    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    },
  });

  const depthTexture = device.createTexture({
    size: presentationSize,
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  let rafId: number;
  // rendering
  //      rendering in webgpu is a simple matter of updating any uniforms you intend to update,
  //      getting the next attachments from your swapchain, submitting your command encoders
  //      to be executed, and using requestAnimationFrame to do it all again
  function render() {
    const renderPassDescriptor = {
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: [0, 0, 0, 1],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),

        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',

        stencilClearValue: 0,
        stencilLoadOp: 'clear',
        stencilStoreOp: 'store',
      },
    };

    // command encoder
    //      command encoders encode all the draw commands you intend to execute in groups of
    //      render pass encoders. once finished encoding all commands, you will receive a
    //      command buffer that can be submitted to the queue
    const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();

    const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(
      // @ts-ignore
      renderPassDescriptor,
    );
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.setVertexBuffer(0, positionBuffer);
    passEncoder.setVertexBuffer(1, colorBuffer);
    passEncoder.setIndexBuffer(indexBuffer, indexFormat);
    passEncoder.drawIndexed(3, 1, 0, 0, 0);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);

    rafId = requestAnimationFrame(render);
  }

  return {
    start() {
      render();
    },

    destroy() {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      uniformBuffer.destroy();

      indexBuffer.destroy();
      colorBuffer.destroy();
      positionBuffer.destroy();
    },
  };
}

import { mat4, glMatrix } from 'gl-matrix';
import { requestGPU, configureSwapChain, createBuffer } from 'toolkit/webgpu/utils';
import CubeVertices from 'utils/cube-vertices';
import { createTextureFromImage } from 'utils/img-loader';
import glslangModule from 'toolkit/webgpu/shaders/glslang';
import triangleVert from './shader.vert';
import triangleFrag from './shader.frag';

export async function createCubeRenderer(canvas: HTMLCanvasElement) {
  const gpu = requestGPU();
  const adapter = await gpu.requestAdapter();
  const device = await adapter.requestDevice();

  const swapChainFormat: GPUTextureFormat = 'bgra8unorm';
  const swapChain = configureSwapChain(canvas, {
    device,
    format: swapChainFormat,
  });

  const positionsBuffer = createBuffer(device, CubeVertices, GPUBufferUsage.VERTEX);
  const positionBufferDescriptor: GPUVertexBufferLayoutDescriptor = {
    attributes: [
      {
        shaderLocation: 0,
        offset: 0,
        format: 'float3',
      },
      {
        shaderLocation: 1,
        offset: 4 * 3,
        format: 'float3',
      },
      {
        shaderLocation: 2,
        offset: 4 * 6,
        format: 'float2',
      },
    ],
    arrayStride: 4 * 8,
    stepMode: 'vertex',
  };

  const modelMatrix = mat4.create();

  const viewMatrix = mat4.create();
  mat4.translate(viewMatrix, viewMatrix, [0, 0, -3]);

  const projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    glMatrix.toRadian(45),
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100.0,
  );
  // prettier-ignore
  const uniforms = new Float32Array([
        ...modelMatrix,
        ...viewMatrix,
        ...projectionMatrix
    ]);

  const cubeTexture = await createTextureFromImage(
    device,
    '/images/container.jpg',
    GPUTextureUsage.SAMPLED,
  );
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });

  const uniformBuffer: GPUBuffer = createBuffer(
    device,
    uniforms,
    GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  );

  const fragmentUniforms = new Float32Array([1.0]);
  const fragmentUniformBuffer: GPUBuffer = createBuffer(
    device,
    fragmentUniforms,
    GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  );
  const uniformBindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX, // specify the stage which has access to the binding
        type: 'uniform-buffer',
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        type: 'sampler',
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        type: 'sampled-texture',
      },
      {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        type: 'uniform-buffer',
      },
    ],
  });
  const uniformBindGroup: GPUBindGroup = device.createBindGroup({
    layout: uniformBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: cubeTexture.createView(),
      },
      {
        binding: 3,
        resource: {
          buffer: fragmentUniformBuffer,
        },
      },
    ],
  });

  const glslang = await glslangModule();
  // const vertexShaderModuleDescriptor: GPUShaderModuleDescriptor = {
  //     code: await loadShader('build/triangle.vert.spv'),
  // };
  const vertexModule: GPUShaderModule = device.createShaderModule({
    code: glslang.compileGLSL(triangleVert, 'vertex'),
  });
  // const fragmentShaderModuleDescriptor: GPUShaderModuleDescriptor = {
  //     code: await loadShader('build/triangle.frag.spv'),
  // };
  const fragmentModule: GPUShaderModule = device.createShaderModule({
    code: glslang.compileGLSL(triangleFrag, 'fragment'),
  });

  const layout: GPUPipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [uniformBindGroupLayout],
  });

  const pipelineDescriptor: GPURenderPipelineDescriptor = {
    layout,

    vertexStage: {
      module: vertexModule,
      entryPoint: 'main',
    },
    fragmentStage: {
      module: fragmentModule,
      entryPoint: 'main',
    },

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
      vertexBuffers: [positionBufferDescriptor],
    },
    rasterizationState: {
      frontFace: 'ccw',
      cullMode: 'none',
    },
  };
  const pipeline: GPURenderPipeline = device.createRenderPipeline(pipelineDescriptor);

  let colorTexture: GPUTexture = swapChain.getCurrentTexture();
  let colorTextureView: GPUTextureView = colorTexture.createView();

  const depthTexture: GPUTexture = device.createTexture({
    size: {
      width: canvas.width,
      height: canvas.height,
      depth: 1,
    },
    mipLevelCount: 1,
    sampleCount: 1,
    dimension: '2d',
    format: 'depth24plus-stencil8',
    usage: GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.COPY_SRC,
  });
  const depthTextureView: GPUTextureView = depthTexture.createView();

  function encodeCommands(delta: number) {
    const colorAttachment: GPURenderPassColorAttachmentDescriptor = {
      attachment: colorTextureView,
      loadValue: { r: 1, g: 1, b: 1, a: 1 },
      storeOp: 'store',
    };

    const depthAttachment: GPURenderPassDepthStencilAttachmentDescriptor = {
      attachment: depthTextureView,
      depthLoadValue: 1,
      depthStoreOp: 'store',
      stencilLoadValue: 'load',
      stencilStoreOp: 'store',
    };

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [colorAttachment],
      depthStencilAttachment: depthAttachment,
    };

    const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();

    mat4.rotate(modelMatrix, modelMatrix, delta * glMatrix.toRadian(45), [0.5, 1.0, 0.0]);
    mat4.perspective(
      projectionMatrix,
      glMatrix.toRadian(45),
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100.0,
    );

    const matrices = Float32Array.from([...modelMatrix, ...viewMatrix, ...projectionMatrix]);
    const uploadBuffer = createBuffer(device, matrices, GPUBufferUsage.COPY_SRC);
    commandEncoder.copyBufferToBuffer(uploadBuffer, 0, uniformBuffer, 0, matrices.byteLength);

    const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
    passEncoder.setScissorRect(0, 0, canvas.width, canvas.height);
    passEncoder.setVertexBuffer(0, positionsBuffer);
    passEncoder.draw(36, 1, 0, 0);
    passEncoder.endPass();

    device.defaultQueue.submit([commandEncoder.finish()]);

    uploadBuffer.destroy();
  }

  let rafId: number;
  let lastTime = performance.now();

  function render() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;

    colorTexture = swapChain.getCurrentTexture();
    colorTextureView = colorTexture.createView();

    encodeCommands(dt / 1000);

    rafId = requestAnimationFrame(render);
  }
  render();

  return {
    enableTextures(state: number) {
      const fragmentUniforms = new Float32Array([state]);
      const uploadBuffer = createBuffer(device, fragmentUniforms, GPUBufferUsage.COPY_SRC);
      const commandEncoder = device.createCommandEncoder();
      // TODO: I dont think this is a good idea to submit a command
      // outside the standard render loop. It seems to flicker alot
      // compared to doing it in the render loop.
      commandEncoder.copyBufferToBuffer(
        uploadBuffer,
        0,
        fragmentUniformBuffer,
        0,
        fragmentUniforms.byteLength,
      );
      device.defaultQueue.submit([commandEncoder.finish()]);
    },
    destroy() {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      positionsBuffer.destroy();
      uniformBuffer.destroy();
      fragmentUniformBuffer.destroy();
      depthTexture.destroy();
      cubeTexture.destroy();
    },
  };
}

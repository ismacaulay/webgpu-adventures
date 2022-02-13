import { CUBE_VERTICES_WITH_COLOR_WITH_UV } from 'utils/cube-vertices';
import { createTextureFromImage } from 'utils/img-loader';

import { vec3, mat4 } from 'gl-matrix';
import { createRenderer } from 'toolkit/webgpu/renderer';
import { createCameraController } from 'toolkit/camera/camera-controller';
import { createBufferManager, createEntityManager, createShaderManager } from 'toolkit/ecs';
import {
  createMeshGeometryComponent,
  createShaderMaterialComponent,
  createTransformComponent,
} from 'toolkit/ecs/components';
import { BufferAttributeFormat } from 'toolkit/webgpu/buffers';
import { createRenderSystem } from 'toolkit/ecs/systems';

export async function createCubeRenderer(canvas: HTMLCanvasElement) {
  const renderer = await createRenderer(canvas);

  const cameraController = createCameraController(canvas);
  const camera = cameraController.camera;
  vec3.set(camera.position, 0, 0, 3);
  camera.updateViewMatrix();

  const entityManager = createEntityManager();
  const bufferManager = createBufferManager(renderer.device);
  const shaderManager = createShaderManager(renderer.device);

  const renderSystem = createRenderSystem(renderer, cameraController, {
    entityManager,
    shaderManager,
    bufferManager,
  });

  const entity = entityManager.create();
  entityManager.addComponent(entity, createTransformComponent({}));
  entityManager.addComponent(
    entity,
    createMeshGeometryComponent({
      count: 36,
      buffers: [
        {
          array: CUBE_VERTICES_WITH_COLOR_WITH_UV,
          attributes: [
            {
              location: 0,
              format: BufferAttributeFormat.Float32x3,
            },
            {
              location: 1,
              format: BufferAttributeFormat.Float32x3,
            },
            {
              location: 2,
              format: BufferAttributeFormat.Float32x2,
            },
          ],
        },
      ],
    }),
  );

  const shader = shaderManager.create();
  entityManager.addComponent(
    entity,
    createShaderMaterialComponent({
      shader: shader,
    }),
  );
  // prettier-ignore
  // const uniforms = new Float32Array([
  //       ...mat4.create(),
  //       ...camera.viewMatrix,
  //       ...camera.projectionMatrix,
  //   ]);

  // const cubeTexture = await createTextureFromImage(
  //   device,
  //   '/images/container.jpg',
  //   GPUTextureUsage.SAMPLED,
  // );
  // const sampler = device.createSampler({
  //   magFilter: 'linear',
  //   minFilter: 'linear',
  // });

  // const uniformBuffer: GPUBuffer = createBuffer(
  //   device,
  //   uniforms,
  //   GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  // );

  // const fragmentUniforms = new Float32Array([1.0]);
  // const fragmentUniformBuffer: GPUBuffer = createBuffer(
  //   device,
  //   fragmentUniforms,
  //   GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  // );
  // const uniformBindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
  //   entries: [
  //     {
  //       binding: 0,
  //       visibility: GPUShaderStage.VERTEX, // specify the stage which has access to the binding
  //       type: 'uniform-buffer',
  //     },
  //     {
  //       binding: 1,
  //       visibility: GPUShaderStage.FRAGMENT,
  //       type: 'sampler',
  //     },
  //     {
  //       binding: 2,
  //       visibility: GPUShaderStage.FRAGMENT,
  //       type: 'sampled-texture',
  //     },
  //     {
  //       binding: 3,
  //       visibility: GPUShaderStage.FRAGMENT,
  //       type: 'uniform-buffer',
  //     },
  //   ],
  // });
  // const uniformBindGroup: GPUBindGroup = device.createBindGroup({
  //   layout: uniformBindGroupLayout,
  //   entries: [
  //     {
  //       binding: 0,
  //       resource: {
  //         buffer: uniformBuffer,
  //       },
  //     },
  //     {
  //       binding: 1,
  //       resource: sampler,
  //     },
  //     {
  //       binding: 2,
  //       resource: cubeTexture.createView(),
  //     },
  //     {
  //       binding: 3,
  //       resource: {
  //         buffer: fragmentUniformBuffer,
  //       },
  //     },
  //   ],
  // });

  // const glslang = await glslangModule();
  // const vertexShaderModuleDescriptor: GPUShaderModuleDescriptor = {
  //     code: await loadShader('build/triangle.vert.spv'),
  // };
  // const vertexModule: GPUShaderModule = device.createShaderModule({
  //   code: glslang.compileGLSL(triangleVert, 'vertex'),
  // });
  // const fragmentShaderModuleDescriptor: GPUShaderModuleDescriptor = {
  //     code: await loadShader('build/triangle.frag.spv'),
  // };
  // const fragmentModule: GPUShaderModule = device.createShaderModule({
  //   code: glslang.compileGLSL(triangleFrag, 'fragment'),
  // });

  // const layout: GPUPipelineLayout = device.createPipelineLayout({
  //   bindGroupLayouts: [uniformBindGroupLayout],
  // });

  // const pipelineDescriptor: GPURenderPipelineDescriptor = {
  //   layout,

  //   vertexStage: {
  //     module: vertexModule,
  //     entryPoint: 'main',
  //   },
  //   fragmentStage: {
  //     module: fragmentModule,
  //     entryPoint: 'main',
  //   },

  //   primitiveTopology: 'triangle-list',
  //   colorStates: [
  //     {
  //       format: 'bgra8unorm',
  //       alphaBlend: {
  //         srcFactor: 'src-alpha',
  //         dstFactor: 'one-minus-src-alpha',
  //         operation: 'add',
  //       },
  //       colorBlend: {
  //         srcFactor: 'src-alpha',
  //         dstFactor: 'one-minus-src-alpha',
  //         operation: 'add',
  //       },
  //       writeMask: GPUColorWrite.ALL,
  //     },
  //   ],

  //   depthStencilState: {
  //     depthWriteEnabled: true,
  //     depthCompare: 'less',
  //     format: 'depth24plus-stencil8',
  //   },
  //   vertexState: {
  //     indexFormat: 'uint16',
  //     vertexBuffers: [positionBufferDescriptor],
  //   },
  //   rasterizationState: {
  //     frontFace: 'ccw',
  //     cullMode: 'none',
  //   },
  // };
  // const pipeline: GPURenderPipeline = device.createRenderPipeline(pipelineDescriptor);

  // let colorTexture: GPUTexture = swapChain.getCurrentTexture();
  // let colorTextureView: GPUTextureView = colorTexture.createView();

  // const depthTexture: GPUTexture = device.createTexture({
  //   size: {
  //     width: canvas.width,
  //     height: canvas.height,
  //     depth: 1,
  //   },
  //   mipLevelCount: 1,
  //   sampleCount: 1,
  //   dimension: '2d',
  //   format: 'depth24plus-stencil8',
  //   usage: GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.COPY_SRC,
  // });
  // const depthTextureView: GPUTextureView = depthTexture.createView();

  // const model = mat4.create();
  // let textureOpacity = 1.0;

  // function encodeCommands() {
  //   const colorAttachment: GPURenderPassColorAttachmentDescriptor = {
  //     attachment: colorTextureView,
  //     loadValue: { r: 1, g: 1, b: 1, a: 1 },
  //     storeOp: 'store',
  //   };

  //   const depthAttachment: GPURenderPassDepthStencilAttachmentDescriptor = {
  //     attachment: depthTextureView,
  //     depthLoadValue: 1,
  //     depthStoreOp: 'store',
  //     stencilLoadValue: 'load',
  //     stencilStoreOp: 'store',
  //   };

  //   const renderPassDescriptor: GPURenderPassDescriptor = {
  //     colorAttachments: [colorAttachment],
  //     depthStencilAttachment: depthAttachment,
  //   };

  //   const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();

  //   // prettier-ignore
  //   const mvp = new Float32Array([
  //           // model matrix
  //           ...model,

  //           // view Matrix
  //           ...camera.viewMatrix,
  //           // ...translate(identity(), [0, 0, -3.0]),

  //           // projection Matrix
  //           ...camera.projectionMatrix,
  //       ]);
  //   const uploadBuffer = createBuffer(device, mvp, GPUBufferUsage.COPY_SRC);
  //   commandEncoder.copyBufferToBuffer(uploadBuffer, 0, uniformBuffer, 0, mvp.byteLength);

  //   const fragmentUniforms = new Float32Array([textureOpacity]);
  //   const fragmentUploadBuffer = createBuffer(device, fragmentUniforms, GPUBufferUsage.COPY_SRC);
  //   commandEncoder.copyBufferToBuffer(
  //     fragmentUploadBuffer,
  //     0,
  //     fragmentUniformBuffer,
  //     0,
  //     fragmentUniforms.byteLength,
  //   );

  //   const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  //   passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
  //   passEncoder.setScissorRect(0, 0, canvas.width, canvas.height);

  //   passEncoder.setPipeline(pipeline);
  //   passEncoder.setBindGroup(0, uniformBindGroup);
  //   passEncoder.setVertexBuffer(0, positionsBuffer);
  //   passEncoder.draw(36, 1, 0, 0);
  //   passEncoder.endPass();

  //   device.defaultQueue.submit([commandEncoder.finish()]);

  //   uploadBuffer.destroy();
  //   fragmentUploadBuffer.destroy();
  // }

  let rafId: number;
  let lastTime = performance.now();

  function render() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

    cameraController.update();

    renderSystem.update();

    rafId = requestAnimationFrame(render);
  }
  render();

  return {
    destroy() {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      shaderManager.destroy();
      bufferManager.destroy();
      entityManager.destroy();

      renderer.destroy();
      cameraController.destroy();
    },
  };
}

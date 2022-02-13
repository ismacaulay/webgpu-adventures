import { createBuffer } from './utils';
import type { VertexBuffer } from './buffers';
import type { Color } from 'toolkit/materials';
import type { Shader } from './shaders';

export interface RendererSubmission {
  shader: any;
  buffers: VertexBuffer[];
  count: number;
}

export enum CommandType {
  Draw,
  CopySrcToDst,
}

export interface DrawCommand {
  type: CommandType.Draw;

  priority: number;
  shader: any;
  buffers: VertexBuffer[];
  count: number;
}

export interface CopySrcToDstCommand {
  type: CommandType.CopySrcToDst;

  src: Float32Array;
  dst: GPUBuffer;
  size: number;
}
export type RendererCommand = DrawCommand | CopySrcToDstCommand;

export interface Renderer {
  begin(): void;
  submit(command: RendererCommand): void;
  finish(): void;
}

function createRenderPipeline(device: GPUDevice, shader: Shader, vertexBuffers: VertexBuffer[]) {
  const layout: GPUPipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [shader.bindGroupLayout],
  });

  return device.createRenderPipeline({
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
      depthWriteEnabled: shader.depthWrite,
      depthCompare: shader.depthFunc,
      format: 'depth24plus-stencil8',

      stencilFront: shader.stencilFront,
      stencilBack: shader.stencilBack,
      stencilWriteMask: shader.stencilWriteMask,
      stencilReadMask: shader.stencilReadMask,
    },

    vertexState: {
      indexFormat: 'uint16',
      vertexBuffers: vertexBuffers.map((vb) => vb.descriptor),
    },
    rasterizationState: {
      frontFace: 'ccw',
      cullMode: 'none',
    },
  });
}

export async function createRenderer(canvas: HTMLCanvasElement) {
  const gpu: GPU | undefined = navigator.gpu;
  if (!gpu) {
    throw new Error('WebGPU not supported in this browser');
  }

  const adapter = await gpu.requestAdapter();
  if (!adapter) {
    throw new Error('Unable to request adapter');
  }

  const device: GPUDevice = await adapter.requestDevice();
  const context = canvas.getContext('webgpu') as GPUCanvasContext;

  // setup the context
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
    sampleCount: 4,
    format: presentationFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
  let renderTargetView = renderTarget.createView();

  // create the depth texture
  let depthTexture = device.createTexture({
    size: presentationSize,
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    sampleCount: 4,
  });
  let depthTextureView = depthTexture.createView();

  let commands: any[] = [];
  let draws: DrawCommand[] = [];
  let clearColor = [0, 0, 0];

  return {
    device,

    begin() {},
    submit(command: RendererCommand) {
      switch (command.type) {
        case CommandType.Draw: {
          draws.push(command);
          break;
        }
        case CommandType.CopySrcToDst: {
          commands.push((encoder: GPUCommandEncoder) => {
            const { src, dst, size } = command;

            // const uploadBuffer = createBuffer(device, src, GPUBufferUsage.COPY_SRC);
            // encoder.copyBufferToBuffer(uploadBuffer, 0, dst, 0, size);

            return () => {
              // uploadBuffer.destroy();
            };
          });
          break;
        }
      }
    },
    finish() {
      if (
        canvas.clientWidth !== presentationSize[0] ||
        canvas.clientHeight !== presentationSize[1]
      ) {
        presentationSize = [
          canvas.clientWidth * devicePixelRatio,
          canvas.clientHeight * devicePixelRatio,
        ];
        context.configure({
          device,
          size: presentationSize,
          format: presentationFormat,
        });
        renderTarget.destroy();
        renderTarget = device.createTexture({
          size: presentationSize,
          sampleCount: 4,
          format: presentationFormat,
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        renderTargetView = renderTarget.createView();
        depthTexture.destroy();
        depthTexture = device.createTexture({
          size: presentationSize,
          format: 'depth24plus',
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
          sampleCount: 4,
        });
        depthTextureView = depthTexture.createView();
      }

      const renderPassDescriptor = {
        colorAttachments: [
          {
            view: renderTargetView,
            resolveTarget: context.getCurrentTexture().createView(),
            loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
            storeOp: 'store',
          },
        ],
        depthStencilAttachment: {
          view: depthTextureView,

          depthLoadValue: 1.0,
          depthStoreOp: 'store',
          stencilLoadValue: 0,
          stencilStoreOp: 'store',
        },
      };

      const commandEncoder = device.createCommandEncoder();

      // encode all upload commands
      const cleanups = commands.map((fn) => fn(commandEncoder));
      commands = [];

      // @ts-ignore
      let passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

      passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
      passEncoder.setScissorRect(0, 0, canvas.width, canvas.height);

      draws.sort((d1, d2) => {
        const first = d1.priority || Number.MAX_VALUE;
        const second = d2.priority || Number.MAX_VALUE;

        if (first === second) {
          return 0;
        }

        return first < second ? -1 : 1;
      });

      // process the draw calls
      let lastShaderId = -1;
      for (let i = 0; i < draws.length; ++i) {
        const { shader, buffers, count, priority } = draws[i];

        if (shader.id !== lastShaderId) {
          passEncoder.setPipeline(createRenderPipeline(device, shader, buffers));
          lastShaderId = shader.id;
        }

        passEncoder.setBindGroup(0, shader.bindGroup);

        buffers.forEach((buf: VertexBuffer, idx: number) => {
          passEncoder.setVertexBuffer(idx, buf.buffer);
        });

        passEncoder.setStencilReference(shader.stencilValue);

        passEncoder.draw(count, 1, 0, 0);
      }

      passEncoder.end();
      device.queue.submit([commandEncoder.finish()]);

      draws = [];

      cleanups.forEach((fn) => fn());
    },

    destroy() {
      depthTexture.destroy();
    },

    set clearColor(value: Color) {
      clearColor = value;
    },
  };
}

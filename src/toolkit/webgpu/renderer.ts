import type { GenericObject } from 'toolkit/types/generic';
import type { VertexBuffer } from 'toolkit/types/webgpu/buffers';
import {
  BufferCommand,
  DrawCommand,
  RenderCommand,
  RenderCommandType,
  Renderer,
} from 'toolkit/types/webgpu/renderer';
import { createBindGroups, createPipeline } from './utils';

export async function createRenderer(canvas: HTMLCanvasElement): Promise<Renderer> {
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
    format: 'depth24plus-stencil8',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    sampleCount: 4,
  });
  let depthTextureView = depthTexture.createView();

  let commands: BufferCommand[] = [];
  let draws: DrawCommand[] = [];

  // TODO: The cache is based on the shader id, but it may need more
  // TODO: When the shader is removed, we dont remove the pipeline; there may be
  //       multiple shaders using the same pipeline (cloned shaders)
  const pipelineCache: GenericObject<GPURenderPipeline> = {};
  const bindGroupCache: GenericObject<GPUBindGroup[]> = {};

  return {
    device,

    begin() {},
    submit(command: RenderCommand | BufferCommand) {
      if (command.type === RenderCommandType.Draw) {
        draws.push(command);
      } else if (
        command.type === RenderCommandType.WriteBuffer ||
        command.type === RenderCommandType.CopyToTexture
      ) {
        commands.push(command);
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
          format: 'depth24plus-stencil8',
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
          sampleCount: 4,
        });
        depthTextureView = depthTexture.createView();
      }

      for (let i = 0; i < commands.length; ++i) {
        const command = commands[i];
        if (command.type === RenderCommandType.WriteBuffer) {
          let { dst, src } = command;

          if (src instanceof Float64Array) {
            src = new Float32Array(src);
          }
          device.queue.writeBuffer(dst, 0, src.buffer, src.byteOffset, src.byteLength);
        } else {
          const { dst, src } = command;
          if (src instanceof ImageBitmap) {
            device.queue.copyExternalImageToTexture({ source: src }, { texture: dst }, [
              src.width,
              src.height,
            ]);
          } else {
            const {
              buffer,
              shape: [width, height],
            } = src;
            device.queue.writeTexture(
              { texture: dst },
              buffer,
              {
                bytesPerRow: width * 4,
              },
              {
                width,
                height,
              },
            );
          }
        }
      }

      const renderPassDescriptor = {
        colorAttachments: [
          {
            view: renderTargetView,
            resolveTarget: context.getCurrentTexture().createView(),
            clearValue: [0, 0, 0, 1],
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
        depthStencilAttachment: {
          view: depthTextureView,

          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',

          stencilClearValue: 0,
          stencilLoadOp: 'clear',
          stencilStoreOp: 'store',
        },
      };

      const commandEncoder = device.createCommandEncoder();
      // TODO: Remove ignore once the types have been updated
      // @ts-ignore
      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

      draws.sort((d1, d2) => {
        const first = d1.priority;
        const second = d2.priority;

        if (first === second) {
          return 0;
        }

        return first < second ? -1 : 1;
      });

      for (let i = 0; i < draws.length; ++i) {
        const command = draws[i];

        const { shader, buffers, count, indices } = command;

        let pipeline = pipelineCache[shader.id];
        if (!pipeline || shader.needsUpdate) {
          pipeline = createPipeline(device, presentationFormat, shader, buffers);
          pipelineCache[shader.id] = pipeline;
        }

        passEncoder.setPipeline(pipeline);

        let groups = bindGroupCache[shader.id];
        if (!groups) {
          groups = createBindGroups(device, pipeline, shader);
          bindGroupCache[shader.id] = groups;
        }

        groups.forEach((group: any, idx: number) => {
          passEncoder.setBindGroup(idx, group);
        });

        command.buffers.forEach((buf: VertexBuffer, idx: number) => {
          passEncoder.setVertexBuffer(idx, buf.buffer);
        });

        passEncoder.setStencilReference(shader.stencilValue);

        if (indices) {
          passEncoder.setIndexBuffer(indices.buffer, indices.format);
          passEncoder.drawIndexed(count, 1, 0, 0, 0);
        } else {
          passEncoder.draw(count, 1, 0, 0);
        }

        shader.needsUpdate = false;
      }

      draws = [];
      commands = [];
      passEncoder.end();
      device.queue.submit([commandEncoder.finish()]);
    },

    destroy() {
      depthTexture.destroy();
      renderTarget.destroy();
    },
  };
}

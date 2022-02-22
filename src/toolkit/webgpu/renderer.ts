import type { GenericObject } from 'toolkit/types/generic';
import { BufferAttributeFormat, VertexBuffer } from 'toolkit/types/webgpu/buffers';
import {
  BufferCommand,
  DrawCommand,
  PostProcessingCommand,
  RenderCommand,
  RenderCommandType,
  Renderer,
} from 'toolkit/types/webgpu/renderer';
import { createBindGroups, createPipeline } from './utils';
import quadShaderSource from './shaders/quad.wgsl';
import { createVertexBuffer } from './buffers';

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
    // sampleCount: 4,
    format: presentationFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
  });
  let renderTargetView = renderTarget.createView();

  // create the depth texture
  let depthTexture = device.createTexture({
    size: presentationSize,
    format: 'depth24plus-stencil8',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    // sampleCount: 4,
  });
  let depthTextureView = depthTexture.createView();

  const quadSampler = device.createSampler();

  // prettier-ignore
  const quadVertices = [
    // positions   // texCoords
    -1.0,  1.0,  0.0, 0.0,
    -1.0, -1.0,  0.0, 1.0,
     1.0, -1.0,  1.0, 1.0,

    -1.0,  1.0,  0.0, 0.0,
     1.0, -1.0,  1.0, 1.0,
     1.0,  1.0,  1.0, 0.0
  ];
  const quadVertexBuffer = createVertexBuffer(device, {
    array: Float32Array.from(quadVertices),
    attributes: [
      {
        location: 0,
        format: BufferAttributeFormat.Float32x2,
      },
      {
        location: 1,
        format: BufferAttributeFormat.Float32x2,
      },
    ],
  });

  const quadShaderModule = device.createShaderModule({
    code: quadShaderSource,
  });
  const quadPipeline = device.createRenderPipeline({
    vertex: {
      module: quadShaderModule,
      entryPoint: 'vertex_main',
      buffers: [quadVertexBuffer.layout],
    },
    fragment: {
      module: quadShaderModule,
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

    // multisample: {
    //   count: 4,
    // },
  });
  let quadBindGroup: GPUBindGroup;
  let quadBindGroupOutput: GPUTextureView;

  let commands: BufferCommand[] = [];
  let draws: DrawCommand[] = [];
  let postProcessing: PostProcessingCommand[] = [];

  // TODO: The cache is based on the shader id, but it may need more
  // TODO: When the shader is removed, we dont remove the pipeline; there may be
  //       multiple shaders using the same pipeline (cloned shaders)
  const pipelineCache: GenericObject<GPURenderPipeline> = {};
  const bindGroupCache: GenericObject<GPUBindGroup[]> = {};
  const postProcessingOutputTextures: GenericObject<{ texture: GPUTexture; view: GPUTextureView }> =
    {};

  let rebuildBindGroups = true;
  let lastOutput: GPUTextureView;

  return {
    device,

    begin() {},

    submit(command: RenderCommand | BufferCommand | PostProcessingCommand) {
      if (command.type === RenderCommandType.Draw) {
        draws.push(command);
      } else if (
        command.type === RenderCommandType.WriteBuffer ||
        command.type === RenderCommandType.CopyToTexture
      ) {
        commands.push(command);
      } else if (command.type === RenderCommandType.PostProcessing) {
        postProcessing.push(command);
      }
    },

    finish() {
      // hand resize if necessary
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
          format: presentationFormat,
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
          // sampleCount: 4,
        });
        renderTargetView = renderTarget.createView();

        depthTexture.destroy();
        depthTexture = device.createTexture({
          size: presentationSize,
          format: 'depth24plus-stencil8',
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
          // sampleCount: 4,
        });
        depthTextureView = depthTexture.createView();

        quadBindGroup = device.createBindGroup({
          layout: quadPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: quadSampler },
            {
              binding: 1,
              // resource: sceneTextureView,
              resource: renderTargetView,
            },
          ],
        });

        rebuildBindGroups = true;
      }

      const commandEncoder = device.createCommandEncoder();

      // handle the copy commands
      for (let i = 0; i < commands.length; ++i) {
        const command = commands[i];
        if (command.type === RenderCommandType.WriteBuffer) {
          let { dst, src } = command;

          if (src instanceof Float64Array) {
            src = new Float32Array(src);
          }
          device.queue.writeBuffer(dst, 0, src.buffer, src.byteOffset, src.byteLength);
        } else if (command.type === RenderCommandType.CopyToTexture) {
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
        } else {
          // @ts-ignore
          throw new Error(`Unknown buffer command: ${command.type}`);
        }
      }
      commands = [];

      // render the scene to the render target
      {
        const passEncoder = commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: renderTargetView,
              // resolveTarget: sceneTextureView,
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
        });

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

        lastOutput = renderTargetView;
        passEncoder.end();
      }

      // run the post processing passes
      {
        for (let i = 0; i < postProcessing.length; ++i) {
          const { shader } = postProcessing[i];

          let output = postProcessingOutputTextures[shader.id];
          if (!output || rebuildBindGroups) {
            if (output) {
              output.texture.destroy();
            }
            const texture = device.createTexture({
              size: presentationSize,
              format: presentationFormat,
              usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            });
            output = {
              texture,
              view: texture.createView(),
            };
            renderTargetView = renderTarget.createView();
          }

          const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [
              {
                view: output.view,
                clearValue: [0, 0, 0, 1],
                loadOp: 'clear',
                storeOp: 'store',
              },
            ],
          });

          let pipeline = pipelineCache[shader.id];
          if (!pipeline || shader.needsUpdate) {
            pipeline = device.createRenderPipeline({
              vertex: {
                module: quadShaderModule,
                entryPoint: 'vertex_main',
                buffers: [quadVertexBuffer.layout],
              },
              fragment: {
                ...shader.fragment,
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
            });
            pipelineCache[shader.id] = pipeline;
            shader.needsUpdate = false;
          }

          let groups = bindGroupCache[shader.id];
          if (!groups || rebuildBindGroups) {
            groups = [
              device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                  { binding: 0, resource: quadSampler },
                  {
                    binding: 1,
                    resource: renderTargetView,
                  },
                ],
              }),
            ];
            bindGroupCache[shader.id] = groups;
          }

          passEncoder.setPipeline(pipeline);
          passEncoder.setBindGroup(0, groups[0]);
          passEncoder.setVertexBuffer(0, quadVertexBuffer.buffer);
          passEncoder.draw(6, 1, 0, 0);
          passEncoder.end();

          lastOutput = output.view;
        }
        postProcessing = [];
      }

      // render the final texture to a quad
      {
        const passEncoder = commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: context.getCurrentTexture().createView(),
              clearValue: [0, 0, 0, 1],
              loadOp: 'clear',
              storeOp: 'store',
            },
          ],
        });

        passEncoder.setPipeline(quadPipeline);

        if (!quadBindGroup || quadBindGroupOutput != lastOutput) {
          quadBindGroupOutput = lastOutput;
          quadBindGroup = device.createBindGroup({
            layout: quadPipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: quadSampler },
              {
                binding: 1,
                resource: quadBindGroupOutput,
              },
            ],
          });
        }
        passEncoder.setBindGroup(0, quadBindGroup);
        passEncoder.setVertexBuffer(0, quadVertexBuffer.buffer);
        passEncoder.draw(6, 1, 0, 0);
        passEncoder.end();
      }

      device.queue.submit([commandEncoder.finish()]);

      rebuildBindGroups = false;
    },

    destroy() {
      depthTexture.destroy();
      renderTarget.destroy();

      Object.values(postProcessingOutputTextures).forEach(({ texture }) => {
        texture.destroy();
      });
    },
  };
}

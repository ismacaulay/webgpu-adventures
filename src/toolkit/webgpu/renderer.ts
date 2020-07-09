import { configureSwapChain, requestGPU, createBuffer } from './utils';
import { VertexBuffer } from './buffers';
import { Color } from 'toolkit/materials';
import { Shader } from './shaders';

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
        },

        vertexState: {
            indexFormat: 'uint16',
            vertexBuffers: vertexBuffers.map(vb => vb.descriptor),
        },
        rasterizationState: {
            frontFace: 'ccw',
            cullMode: 'none',
        },
    });
}

export async function createRenderer(canvas: HTMLCanvasElement) {
    const gpu = requestGPU();
    const adapter = await gpu.requestAdapter();
    const device = await adapter.requestDevice();

    const swapChainFormat: GPUTextureFormat = 'bgra8unorm';
    const swapChain = configureSwapChain(canvas, {
        device,
        format: swapChainFormat,
    });

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

    let commands: any[] = [];
    let draws: any[] = [];
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

                        const uploadBuffer = createBuffer(device, src, GPUBufferUsage.COPY_SRC);
                        encoder.copyBufferToBuffer(uploadBuffer, 0, dst, 0, size);

                        return () => {
                            uploadBuffer.destroy();
                        };
                    });
                    break;
                }
            }
        },
        finish() {
            const colorTexture = swapChain.getCurrentTexture();
            const colorTextureView = colorTexture.createView();

            const colorAttachment: GPURenderPassColorAttachmentDescriptor = {
                attachment: colorTextureView,
                loadValue: { r: clearColor[0], g: clearColor[1], b: clearColor[2], a: 1 },
                // loadValue: { r: 1, g: 1, b: 1, a: 1 },
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

            const commandEncoder = device.createCommandEncoder();

            // encode all upload commands
            const cleanups = commands.map(fn => fn(commandEncoder));
            commands = [];

            const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

            passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
            passEncoder.setScissorRect(0, 0, canvas.width, canvas.height);

            // process the draw calls
            let lastShaderId = -1;
            for (let i = 0; i < draws.length; ++i) {
                const { shader, buffers, count } = draws[i];

                if (shader.id !== lastShaderId) {
                    passEncoder.setPipeline(createRenderPipeline(device, shader, buffers));
                    lastShaderId = shader.id;
                }

                passEncoder.setBindGroup(0, shader.bindGroup);

                buffers.forEach((buf: VertexBuffer, idx: number) => {
                    passEncoder.setVertexBuffer(idx, buf.buffer);
                });

                passEncoder.draw(count, 1, 0, 0);
            }
            draws = [];

            passEncoder.endPass();
            device.defaultQueue.submit([commandEncoder.finish()]);

            cleanups.forEach(fn => fn());
        },

        destroy() {
            depthTexture.destroy();
        },

        set clearColor(value: Color) {
            clearColor = value;
        },
    };
}

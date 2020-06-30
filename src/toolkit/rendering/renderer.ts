import { configureSwapChain, requestGPU, createBuffer } from 'rendering/utils';
import { VertexBuffer } from './buffers';

export interface RendererSubmission {
    shader: any;
    buffers: VertexBuffer[];
    count: number;
}

export enum RendererCommandType {
    CopySrcToDst,
}

export interface CopySrcToDstCommand {
    type: RendererCommandType.CopySrcToDst;

    src: Float32Array;
    dst: GPUBuffer;
    size: number;
}
export type RendererCommand = CopySrcToDstCommand;

export interface Renderer {
    begin(): void;
    finish(): void;

    beginRenderPass(): void;
    endPass(): void;

    submitCommand(command: RendererCommand): void;
    submit(data: RendererSubmission): void;
}

function createRenderPipeline(
    device: GPUDevice,
    shader: any,
    vertexBuffers: VertexBuffer[],
) {
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
            depthWriteEnabled: true,
            depthCompare: 'less',
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

    let commandEncoder: GPUCommandEncoder;
    let passEncoder: GPURenderPassEncoder;
    let buffersToCleanup: GPUBuffer[] = [];

    return {
        device,

        begin() {
            commandEncoder = device.createCommandEncoder();
        },

        beginRenderPass() {
            const colorTexture = swapChain.getCurrentTexture();
            const colorTextureView = colorTexture.createView();

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

            passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

            passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
            passEncoder.setScissorRect(0, 0, canvas.width, canvas.height);
        },
        endPass() {
            passEncoder.endPass();
        },

        submitCommand(command: RendererCommand) {
            const { type } = command;

            if (type === RendererCommandType.CopySrcToDst) {
                const { src, dst, size } = command;
                const upload = createBuffer(
                    device,
                    src,
                    GPUBufferUsage.COPY_SRC,
                );

                commandEncoder.copyBufferToBuffer(upload, 0, dst, 0, size);

                buffersToCleanup.push(upload);
            }
        },

        submit(data: RendererSubmission) {
            const { shader, buffers, count } = data;
            const pipeline = createRenderPipeline(device, shader, buffers);

            passEncoder.setPipeline(pipeline);
            passEncoder.setBindGroup(0, shader.bindGroup);

            for (let i = 0; i < buffers.length; ++i) {
                passEncoder.setVertexBuffer(i, buffers[i].buffer);
            }

            passEncoder.draw(count, 1, 0, 0);
        },

        finish() {
            device.defaultQueue.submit([commandEncoder.finish()]);

            buffersToCleanup.forEach(b => b.destroy());
            buffersToCleanup = [];
        },
    };
}

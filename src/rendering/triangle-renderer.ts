/*
 * This is a simple WebGPU example that renders a triangle onto the canvas
 * It is extremely verbose so that all of the typing information can be specified
 * for every step of building the rendering pipeline.
 */
/// <reference path="../../node_modules/@webgpu/types/dist/index.d.ts" />

import glslangModule from 'toolkit/webgpu/shaders/glslang';
// @ts-ignore
import triangleVert from './shaders/triangle.vert';
// @ts-ignore
import triangleFrag from './shaders/triangle.frag';

export function createBuffer(
    device: GPUDevice,
    src: Float32Array | Uint16Array,
    usage: number,
) {
    // create a buffer
    //  the simplest way is to create a mapped buffer, then write the array to the mapping
    //  you can also create a buffer, then request the mapping afterwards (not sure how to yet)
    //  finally, you can use copyBufferToBuffer to copy the data from one buffer to another

    const descriptor: GPUBufferDescriptor = { size: src.byteLength, usage };
    const [buffer, mapping]: [
        GPUBuffer,
        ArrayBuffer,
    ] = device.createBufferMapped(descriptor);
    // write the data to the mapped buffer
    new (src as any).constructor(mapping).set(src);
    // the buffer needs to be unmapped before it can be submitted to the queue
    buffer.unmap();
    return buffer;
}

export async function createTriangleRenderer(canvas: HTMLCanvasElement) {
    // check if webgpu is supported
    const entry: GPU | undefined = navigator.gpu;
    if (!entry) {
        // TODO: Should put a message on the page if it is not supported
        throw new Error('WebGPU not supported in this browser');
    }

    // request a physical device adapter
    //      an adapter describes the phycical properties fo a given GPU
    //      such as name, extensions, device limits...
    const adapter: GPUAdapter = await entry.requestAdapter();

    // request a device
    //      a device is how you access the core of the webgpu api
    const device: GPUDevice = await adapter.requestDevice();

    // get a gpu queue
    //      a queue allows you to send work async to the GPU.
    //      currently, you can only use the default queue (this will change?)
    const queue: GPUQueue = device.defaultQueue;

    // create a swapchain from the canvas element to be able to see what
    // you are drawing
    //      A swap chain is a series of virtual frame buffers utilized by the graphics card
    //      for framerate stabalization (and other functions). A swapchain of 2 buffers is a
    //      double buffer.
    //
    //      The descriptor defines the the swap chain to be built. It requires the device
    //      and a texture format. The usage parameter defaults to an GPUTextureUsage.OUTPUT_ATTACHMENT.
    //      Depending on what you want to do with the output texture, you may need to set more usage
    //      flags. For example if you want to copy the texture to another texture for use, then you
    //      will need to specify a GPUTextureUsage.COPY_SRC flag along with the
    //      GPUTextureUsage.OUTPUT_ATTACHMENT flag
    //
    //      Note: format rgba8unorm is depricated, use bgra8unorm
    const context: GPUCanvasContext = canvas.getContext('gpupresent') as any;
    const swapChainDescriptor: GPUSwapChainDescriptor = {
        device,
        format: 'bgra8unorm',
    };
    const swapchain: GPUSwapChain = context.configureSwapChain(
        swapChainDescriptor,
    );

    // create some framebuffer attachments
    //      these are the output textures to write to. these could
    //      be depth textures, or other attachments for various types
    //      of rendering techniques
    const depthTextureDescriptor: GPUTextureDescriptor = {
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
    };
    const depthTexture: GPUTexture = device.createTexture(
        depthTextureDescriptor,
    );
    const depthTextureView: GPUTextureView = depthTexture.createView();

    let colorTexture: GPUTexture = swapchain.getCurrentTexture();
    let colorTextureView: GPUTextureView = colorTexture.createView();

    // create vertex/index buffers
    // prettier-ignore
    const positions = new Float32Array([
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        0.0, 1.0, 0.0,
    ]);
    const positionBuffer = createBuffer(
        device,
        positions,
        GPUBufferUsage.VERTEX,
    );

    // prettier-ignore
    const colors = new Float32Array([
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0,
    ]);
    const colorBuffer = createBuffer(device, colors, GPUBufferUsage.VERTEX);

    const indices = new Uint16Array([0, 1, 2]);
    const indexBuffer = createBuffer(device, indices, GPUBufferUsage.INDEX);

    // load the shader modules
    //  shader modules are precompiled shader binaries that execute on the gpu. the
    //  glslang wasm library can be used to compile shader src to shader binaries at
    //  runtime. they can also just be a precompiled spir-v binary that gets loaded
    //  using fetch.
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

    // create a uniform buffer
    // prettier-ignore
    const uniforms = new Float32Array([
        //  ModelViewProjection Matrix
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);
    const uniformBuffer: GPUBuffer = createBuffer(
        device,
        uniforms,
        GPUBufferUsage.UNIFORM,
    );

    // create a pipeline layout to describe where the uniform will be when executing a graphics pipeline
    //
    // a GPUBindGroupLayout defines the interface between a set of resource bound in the GPUBindGroup and
    // their accessibility in shader stages. A GPUBindGroupLayoutEntry describes a single shader resource
    // binding to be included in a GPUBindGroupLayout
    const uniformBindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout(
        {
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX, // specify the stage which has access to the binding
                    type: 'uniform-buffer',
                },
            ],
        },
    );
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

    // input assembly
    //      what does each vertex look like, which attributes are where and how they
    //      align in memory
    const positionAttribDescriptor: GPUVertexAttributeDescriptor = {
        shaderLocation: 0,
        offset: 0,
        format: 'float3',
    };
    const positionBufferDescriptor: GPUVertexBufferLayoutDescriptor = {
        attributes: [positionAttribDescriptor],
        arrayStride: 4 * 3, // sizeof(float) * 3
        stepMode: 'vertex',
    };

    const colorAttribDescriptor: GPUVertexAttributeDescriptor = {
        shaderLocation: 1,
        offset: 0,
        format: 'float3',
    };
    const colorBufferDescriptor: GPUVertexBufferLayoutDescriptor = {
        attributes: [colorAttribDescriptor],
        arrayStride: 4 * 3, // sizeof(float) * 3
        stepMode: 'vertex',
    };

    const vertexState: GPUVertexStateDescriptor = {
        indexFormat: 'uint16',
        vertexBuffers: [positionBufferDescriptor, colorBufferDescriptor],
    };

    // shader modules
    //      what shader modules will be used in the pipeline
    const vertexStage: GPUProgrammableStageDescriptor = {
        module: vertexModule,
        entryPoint: 'main',
    };

    const fragmentStage: GPUProgrammableStageDescriptor = {
        module: fragmentModule,
        entryPoint: 'main',
    };

    // depth/stencil state
    //      should you perform depth testing? which function should you use to test depth
    const depthStencilState: GPUDepthStencilStateDescriptor = {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus-stencil8',
    };

    // blend state
    //      how should colors be blended between previously written color and current one
    const colorState: GPUColorStateDescriptor = {
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
    };

    // rasterization
    //      how does the rasterizer behave when executing the graphics pipeline. does it cull faces?
    //      which direction should the face be culled
    const rasterizationState: GPURasterizationStateDescriptor = {
        frontFace: 'ccw',
        cullMode: 'back',
    };

    // create the pipeline
    const pipelineDescriptor: GPURenderPipelineDescriptor = {
        layout,

        vertexStage,
        fragmentStage,

        primitiveTopology: 'triangle-list',
        colorStates: [colorState],
        depthStencilState,
        vertexState,
        rasterizationState,
    };
    const pipeline: GPURenderPipeline = device.createRenderPipeline(
        pipelineDescriptor,
    );

    // command encoder
    //      command encoders encode all the draw commands you intend to execute in groups of
    //      render pass encoders. once finished encoding all commands, you will receive a
    //      command buffer that can be submitted to the queue
    function encodeCommands() {
        // clear
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

        const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(
            renderPassDescriptor,
        );
        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, uniformBindGroup);
        passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
        passEncoder.setScissorRect(0, 0, canvas.width, canvas.height);
        passEncoder.setVertexBuffer(0, positionBuffer);
        passEncoder.setVertexBuffer(1, colorBuffer);
        passEncoder.setIndexBuffer(indexBuffer);
        passEncoder.drawIndexed(3, 1, 0, 0, 0);
        passEncoder.endPass();

        queue.submit([commandEncoder.finish()]);
    }

    let rafId: number;
    // rendering
    //      rendering in webgpu is a simple matter of updating any uniforms you intend to update,
    //      getting the next attachments from your swapchain, submitting your command encoders
    //      to be executed, and using requestAnimationFrame to do it all again
    function render() {
        colorTexture = swapchain.getCurrentTexture();
        colorTextureView = colorTexture.createView();

        encodeCommands();

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

            colorTexture.destroy();
            depthTexture.destroy();
        },
    };
}

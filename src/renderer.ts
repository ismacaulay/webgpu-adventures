/// <reference path="../node_modules/@webgpu/types/dist/index.d.ts" />

function createBuffer(device: GPUDevice, arr: Float32Array | Uint16Array, usage: number) {
    // create a buffer
    const descriptor: GPUBufferDescriptor = { size: arr.byteLength, usage };
    const [buffer, bufferMapped]: [GPUBuffer, ArrayBuffer] = device.createBufferMapped(descriptor)

    // write the data to the mapped buffer
    const writeArray = arr instanceof Float32Array ? new Float32Array(bufferMapped) : new Uint16Array(bufferMapped);
    writeArray.set(arr);
    buffer.unmap();
    return buffer;
}

async function loadShader(url: string) {
    return fetch(url, { mode: 'cors' })
        .then(res => res.arrayBuffer().then(arr => new Uint32Array(arr)));

}

export function webGPUSupported() {
    return navigator.gpu !== undefined;
}

export async function createRenderer(canvas: HTMLCanvasElement) {
    // check if webgpu is supported
    const entry = navigator.gpu;
    if (!entry) {
        // TODO: Should put a message on the page if it is not supported
        throw new Error('WebGPU not supported in this browser');
    }
    console.log('WebGPU supported')

    // request a physical device adapter
    //      an adapter describes the phycical properties fo a given GPU
    //      such as name, extensions, device limits...
    const adapter: GPUAdapter = await entry.requestAdapter();
    console.log(adapter);

    // request a device
    //      a device is how you access the core of the webgpu api
    const device: GPUDevice = await adapter.requestDevice();

    // get a gpu queue
    //      a queue allows you to send work async to the GPU.
    //      currently, you can only use the default queue (this will change?)
    const queue: GPUQueue = device.defaultQueue;

    // create a swapchain from the canvas element to be able to see what
    // you are drawing
    //      Q: What is a swap chain?
    //      Q: What do the parameters of the descriptor mean?
    const context: GPUCanvasContext = canvas.getContext('gpupresent') as any;
    const swapChainDescriptor: GPUSwapChainDescriptor = {
        device,
        format: 'bgra8unorm',
        usage: GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.COPY_SRC
    }
    const swapchain: GPUSwapChain = context.configureSwapChain(swapChainDescriptor);

    // create some framebuffer attachments
    //      these are the output textures to write too. these could
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
    }
    const depthTexture: GPUTexture = device.createTexture(depthTextureDescriptor);
    const depthTextureView: GPUTextureView = depthTexture.createView();

    let colorTexture: GPUTexture = swapchain.getCurrentTexture();
    let colorTextureView: GPUTextureView = colorTexture.createView();

    // create vertex/index buffers
    const positions = new Float32Array([
        1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0,
        0.0, 1.0, 0.0
    ]);
    const positionBuffer = createBuffer(device, positions, GPUBufferUsage.VERTEX);

    const colors = new Float32Array([
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0
    ])
    const colorBuffer = createBuffer(device, colors, GPUBufferUsage.VERTEX);

    const indices = new Uint16Array([
        0, 1, 2
    ])
    const indexBuffer = createBuffer(device, indices, GPUBufferUsage.INDEX);

    // load the shader modules
    //      shader modules are precompiled shader binaries that execute on the gpu
    const vertexShaderModuleDescriptor: GPUShaderModuleDescriptor = { code: await loadShader('build/triangle.vert.spv') };
    const vertexModule: GPUShaderModule = device.createShaderModule(vertexShaderModuleDescriptor);
    const fragmentShaderModuleDescriptor: GPUShaderModuleDescriptor = { code: await loadShader('build/triangle.frag.spv') };
    const fragmentModule: GPUShaderModule = device.createShaderModule(fragmentShaderModuleDescriptor);

    // create a uniform buffer
    const uniforms = new Float32Array([
        //  ModelViewProjection Matrix
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0,

        // Primary Color
        0.9, 0.1, 0.3, 1.0,

        // Accent Color
        0.8, 0.2, 0.8, 1.0,
    ]);
    const uniformBuffer = createBuffer(device, uniforms, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST)

    // create a pipeline layout to describe where the uniform will be when executing a graphics pipeline
    const uniformBindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            type: 'uniform-buffer'
        }],
    });
    const uniformBindGroup = device.createBindGroup({
        layout: uniformBindGroupLayout,
        entries: [{
            binding: 0,
            resource: {
                buffer: uniformBuffer,
            }
        }],
    });

    const layout: GPUPipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [uniformBindGroupLayout] })

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
    }
    const colorAttribDescriptor: GPUVertexAttributeDescriptor = {
        shaderLocation: 1,
        offset: 0,
        format: 'float3',
    }
    const positionBufferDescriptor: GPUVertexBufferLayoutDescriptor = {
        attributes: [positionAttribDescriptor],
        arrayStride: 4 * 3, // sizeof(float) * 3
        stepMode: 'vertex'
    }
    const colorBufferDescriptor: GPUVertexBufferLayoutDescriptor = {
        attributes: [colorAttribDescriptor],
        arrayStride: 4 * 3, // sizeof(float) * 3
        stepMode: 'vertex'
    }

    const vertexState: GPUVertexStateDescriptor = {
        indexFormat: 'uint16',
        vertexBuffers: [positionBufferDescriptor, colorBufferDescriptor]
    }

    // shader modules
    //      what shader modules will be used in the pipeline
    const vertexStage: GPUProgrammableStageDescriptor = {
        module: vertexModule,
        entryPoint: 'main',
    }

    const fragmentStage: GPUProgrammableStageDescriptor = {
        module: fragmentModule,
        entryPoint: 'main',
    }

    // depth/stencil state
    //      should you perform depth testing? which function should you use to test depth
    const depthStencilState: GPUDepthStencilStateDescriptor = {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus-stencil8'
    }

    // blend state
    //      how should colors be blended between previously written color and current one
    const colorState: GPUColorStateDescriptor = {
        format: 'bgra8unorm',
        alphaBlend: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add'
        },
        colorBlend: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add'
        },
        writeMask: GPUColorWrite.ALL
    }

    // rasterization
    //      how does the rasterizer behave when executing the graphics pipeline. does it cull faces?
    //      which direction should the face be culled
    const rasterizationState: GPURasterizationStateDescriptor = {
        frontFace: 'cw',
        cullMode: 'none',
    }

    // create the pipeline
    const pipelineDescriptor: GPURenderPipelineDescriptor = {
        layout,

        vertexStage,
        fragmentStage,

        primitiveTopology: 'triangle-list',
        colorStates: [colorState],
        depthStencilState,
        vertexState,
        rasterizationState
    }
    const pipeline = device.createRenderPipeline(pipelineDescriptor);

    // command encoder
    //      command encoders encode all the draw commands you intend to execute in groups of
    //      render pass encoders. once finished encoding all commands, you will receive a 
    //      command buffer that can be submitted to the queue

    function encodeCommands() {
        const colorAttachment: GPURenderPassColorAttachmentDescriptor = {
            attachment: colorTextureView,
            loadValue: { r: 1, g: 1, b: 1, a: 1 },
            storeOp: 'store',
        }

        const depthAttachment: GPURenderPassDepthStencilAttachmentDescriptor = {
            attachment: depthTextureView,
            depthLoadValue: 1,
            depthStoreOp: 'store',
            stencilLoadValue: 'load',
            stencilStoreOp: 'store',
        }

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [colorAttachment],
            depthStencilAttachment: depthAttachment,
        }

        const commandEncoder = device.createCommandEncoder();

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
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

    // rendering
    //      rendering in webgpu is a simple matter of updating any uniforms you intend to update,
    //      getting the next attachments from your swapchain, submitting your command encoders
    //      to be executed, and using requestAnimationFrame to do it all again
    function render() {
        colorTexture = swapchain.getCurrentTexture();
        colorTextureView = colorTexture.createView();

        encodeCommands();

        requestAnimationFrame(render);
    }

    return {
        start() {
            console.log('starting')
            render();
        }
    }
}
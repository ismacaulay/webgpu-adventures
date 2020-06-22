import { requestGPU, configureSwapChain, createBuffer } from './utils';
import CubeVertices from '../utils/cube-vertices';
import { createTextureFromImage } from '../utils/img-loader';
import glslangModule from './glslang';
// @ts-ignore
import triangleVert from './shaders/cube.vert';
// @ts-ignore
import triangleFrag from './shaders/cube.frag';

import { perspective, radians, identity } from '../math';
import { createFreeCameraController } from 'toolkit/camera/free-camera-controller';
import { createCamera } from 'toolkit/camera/camera';

export async function createCubeRenderer(canvas: HTMLCanvasElement) {
    const gpu = requestGPU();
    const adapter = await gpu.requestAdapter();
    const device = await adapter.requestDevice();

    const swapChainFormat: GPUTextureFormat = 'bgra8unorm';
    const swapChain = configureSwapChain(canvas, {
        device,
        format: swapChainFormat,
    });

    const positionsBuffer = createBuffer(
        device,
        CubeVertices,
        GPUBufferUsage.VERTEX,
    );
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

    const camera = createCamera();
    camera.position.set([0, 0, 3]);
    camera.updateViewMatrix();
    
    const cameraController = createFreeCameraController(canvas, camera);

    // prettier-ignore
    const uniforms = new Float32Array([
        // model matrix
        ...identity(),

        // view Matrix
        ...camera.matrix.value,
        // ...translate(identity(), [0, 0, -3.0]),

        // projection Matrix
        ...perspective(radians(45.0), canvas.clientWidth / canvas.clientHeight, 0.1, 100.0),
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
    const uniformBindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout(
        {
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
        },
    );
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
    const pipeline: GPURenderPipeline = device.createRenderPipeline(
        pipelineDescriptor,
    );

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

    let model = identity();
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

        // prettier-ignore
        const mvp = new Float32Array([
            // model matrix
            ...identity(),

            // view Matrix
            ...camera.matrix.value,
            // ...translate(identity(), [0, 0, -3.0]),

            // projection Matrix
            ...perspective(radians(45.0), canvas.clientWidth / canvas.clientHeight, 0.1, 100.0),
        ]);
        const uploadBuffer = createBuffer(device, mvp, GPUBufferUsage.COPY_SRC);
        commandEncoder.copyBufferToBuffer(
            uploadBuffer,
            0,
            uniformBuffer,
            0,
            mvp.byteLength,
        );

        const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(
            renderPassDescriptor,
        );
        passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
        passEncoder.setScissorRect(0, 0, canvas.width, canvas.height);

        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, uniformBindGroup);
        passEncoder.setVertexBuffer(0, positionsBuffer);
        passEncoder.draw(36, 1, 0, 0);
        passEncoder.endPass();

        device.defaultQueue.submit([commandEncoder.finish()]);
    }

    let rafId: number;
    let lastTime = performance.now();

    function render() {
        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        cameraController.update(dt);

        colorTexture = swapChain.getCurrentTexture();
        colorTextureView = colorTexture.createView();

        encodeCommands(dt / 1000);

        rafId = requestAnimationFrame(render);
    }
    render();

    return {
        enableTextures(state: number) {
            const fragmentUniforms = new Float32Array([state]);
            const uploadBuffer = createBuffer(
                device,
                fragmentUniforms,
                GPUBufferUsage.COPY_SRC,
            );
            const commandEncoder = device.createCommandEncoder();
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

            cameraController.destroy();
            positionsBuffer.destroy();
            uniformBuffer.destroy();
            fragmentUniformBuffer.destroy();
            depthTexture.destroy();
            cubeTexture.destroy();
        },
    };
}

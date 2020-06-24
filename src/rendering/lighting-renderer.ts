import { requestGPU, configureSwapChain, createBuffer } from './utils';
import { CUBE_VERTICES, CUBE_VERTICES_WITH_NORMALS } from 'utils/cube-vertices';

import { createShader } from 'toolkit/rendering/shaders/shader';

// @ts-ignore
import cubeVert from './shaders/lighting.vert';
// @ts-ignore
import cubeFrag from './shaders/lighting.frag';
// @ts-ignore
import lightVert from './shaders/light.vert';
// @ts-ignore
import lightFrag from './shaders/light.frag';

import { perspective, radians, identity, rotate } from '../math';
import { createFreeCameraController } from 'toolkit/camera/free-camera-controller';
import { createCamera } from 'toolkit/camera/camera';
import { createMat4 } from 'toolkit/math/mat4';
import { createVec3 } from 'toolkit/math/vec3';
import { createUniformBuffer } from 'toolkit/rendering/buffers/uniform-buffer';

export async function createLightingRenderer(canvas: HTMLCanvasElement) {
    const camera = createCamera();
    camera.position.set([0, 0, 3]);
    camera.updateViewMatrix();
    const cameraController = createFreeCameraController(canvas, camera);

    const lightPos = createVec3([1.2, 1.0, 2.0]);

    const gpu = requestGPU();
    const adapter = await gpu.requestAdapter();
    const device = await adapter.requestDevice();

    const swapChainFormat: GPUTextureFormat = 'bgra8unorm';
    const swapChain = configureSwapChain(canvas, {
        device,
        format: swapChainFormat,
    });

    // TODO: Abstract vertex buffers and layouts
    const positionsBuffer = createBuffer(
        device,
        CUBE_VERTICES_WITH_NORMALS,
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
        ],
        arrayStride: 4 * 6,
        stepMode: 'vertex',
    };

    const viewProjectionUBO = createUniformBuffer(device, {
        view: camera.matrix.value,
        projection: perspective(
            radians(45.0),
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            100.0,
        ),
    });

    // prettier-ignore
    const cubeVertexUBO = createUniformBuffer(device, {
        model: identity(),
    })

    const cubeFragmentUBO = createUniformBuffer(device, {
        u_object_color: [1.0, 0.5, 0.31],
        u_light_color: [1.0, 1.0, 1.0],
        light_pos: lightPos.value,
        view_pos: camera.position.value,
    });

    const cubeUniformBindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout(
        {
            entries: [
                // viewProjection
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    type: 'uniform-buffer',
                },
                // modelMatrix
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    type: 'uniform-buffer',
                },
                // objectUniforms
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    type: 'uniform-buffer',
                },
            ],
        },
    );
    const cubeUniformBindGroup: GPUBindGroup = device.createBindGroup({
        layout: cubeUniformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: viewProjectionUBO.buffer,
                },
            },
            {
                binding: 1,
                resource: {
                    buffer: cubeVertexUBO.buffer,
                },
            },
            {
                binding: 2,
                resource: {
                    buffer: cubeFragmentUBO.buffer,
                },
            },
        ],
    });

    const cubeShader = await createShader(device, {
        vertex: cubeVert,
        fragment: cubeFrag,
    });
    const cubeLayout: GPUPipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [cubeUniformBindGroupLayout],
    });

    const cubePipeline: GPURenderPipeline = device.createRenderPipeline({
        layout: cubeLayout,

        ...cubeShader.stages,

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
    });

    // LIGHT
    const lightPositionsBuffer = createBuffer(
        device,
        CUBE_VERTICES,
        GPUBufferUsage.VERTEX,
    );
    const lightPositionBufferDescriptor: GPUVertexBufferLayoutDescriptor = {
        attributes: [
            {
                shaderLocation: 0,
                offset: 0,
                format: 'float3',
            },
        ],
        arrayStride: 4 * 3,
        stepMode: 'vertex',
    };

    const lightModelMatrix = createMat4();
    lightModelMatrix.translate(lightPos);
    lightModelMatrix.scale(createVec3([0.2, 0.2, 0.2]));

    const lightVertexUBO = createUniformBuffer(device, {
        model: lightModelMatrix.value,
    });

    const lightFragmentUBO = createUniformBuffer(device, {
        u_light_color: [1.0, 1.0, 1.0],
    });

    const lightUniformBindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout(
        {
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    type: 'uniform-buffer',
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    type: 'uniform-buffer',
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    type: 'uniform-buffer',
                },
            ],
        },
    );
    const lightUniformBindGroup: GPUBindGroup = device.createBindGroup({
        layout: lightUniformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: viewProjectionUBO.buffer,
                },
            },
            {
                binding: 1,
                resource: {
                    buffer: lightVertexUBO.buffer,
                },
            },
            {
                binding: 2,
                resource: {
                    buffer: lightFragmentUBO.buffer,
                },
            },
        ],
    });

    const lightShader = await createShader(device, {
        vertex: lightVert,
        fragment: lightFrag,
    });
    const lightPipelineLayout: GPUPipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [lightUniformBindGroupLayout],
    });

    const lightPipeline: GPURenderPipeline = device.createRenderPipeline({
        layout: lightPipelineLayout,

        ...lightShader.stages,

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
            vertexBuffers: [lightPositionBufferDescriptor],
        },
        rasterizationState: {
            frontFace: 'ccw',
            cullMode: 'none',
        },
    });

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

    let lightRotation = 0;
    function encodeCommands(delta: number) {
    

        const colorAttachment: GPURenderPassColorAttachmentDescriptor = {
            attachment: colorTextureView,
            loadValue: { r: 0, g: 0, b: 0, a: 1 },
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

        viewProjectionUBO.updateUniform('view', camera.matrix.value);
        viewProjectionUBO.updateUniform(
            'projection',
            perspective(
                radians(45.0),
                canvas.clientWidth / canvas.clientHeight,
                0.1,
                100.0,
            ),
        );
        viewProjectionUBO.updateBuffer();

        lightRotation += delta;
        lightRotation %= 2 * Math.PI;
        lightPos.set([1.0 * Math.sin(lightRotation), 1.0, 1.0 * Math.cos(lightRotation)]);
        lightModelMatrix.setTranslation(lightPos);
        lightVertexUBO.updateUniform('model', lightModelMatrix.value);
        lightVertexUBO.updateBuffer();

        cubeFragmentUBO.updateUniform('light_pos', lightPos.value);
        cubeFragmentUBO.updateUniform('view_pos', camera.position.value);
        cubeFragmentUBO.updateBuffer();

        const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();

        const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(
            renderPassDescriptor,
        );
        passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
        passEncoder.setScissorRect(0, 0, canvas.width, canvas.height);

        passEncoder.setPipeline(cubePipeline);
        passEncoder.setBindGroup(0, cubeUniformBindGroup);
        passEncoder.setVertexBuffer(0, positionsBuffer);
        passEncoder.draw(36, 1, 0, 0);

        passEncoder.setPipeline(lightPipeline);
        passEncoder.setBindGroup(0, lightUniformBindGroup);
        passEncoder.setVertexBuffer(0, lightPositionsBuffer);
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

        encodeCommands(dt);

        rafId = requestAnimationFrame(render);
    }
    render();

    return {
        destroy() {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }

            cameraController.destroy();

            viewProjectionUBO.destroy();

            cubeVertexUBO.destroy();
            cubeFragmentUBO.destroy();

            positionsBuffer.destroy();

            lightPositionsBuffer.destroy();
            lightVertexUBO.destroy();
            lightFragmentUBO.destroy();

            depthTexture.destroy();
        },
    };
}

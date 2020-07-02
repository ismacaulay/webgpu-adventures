import glslangModule from 'toolkit/webgpu/shaders/glslang';
import { requestGPU, configureSwapChain } from './utils';
import { CUBE_VERTICES, CUBE_VERTICES_WITH_NORMALS } from 'utils/cube-vertices';

import { createShader } from 'toolkit/webgpu/shaders/shader';

import cubePhongVert from './shaders/lighting.vert';
// import cubePhongFrag from './shaders/lighting.frag';
import cubePhongMaterialFrag from './shaders/lighting-material.frag';
// import cubeGouraudVert from './shaders/gouraud.vert';
// import cubeGouraudFrag from './shaders/gouraud.frag';
import lightVert from './shaders/light.vert';
import lightFrag from './shaders/light.frag';

import { createFreeCameraController } from 'toolkit/camera/free-camera-controller';
import { createCamera } from 'toolkit/camera/camera';
import { createUniformBuffer } from 'toolkit/webgpu/buffers/uniform-buffer';
import { createMeshRenderer } from 'toolkit/webgpu/meshRenderer';
import {
    createVertexBuffer,
    BufferAttributeType,
} from 'toolkit/webgpu/buffers';
import { vec3, mat4 } from 'gl-matrix';

interface Material {
    ambient: [number, number, number];
    diffuse: [number, number, number];
    specular: [number, number, number];
    shininess: number;
}

export async function createLightingRenderer(canvas: HTMLCanvasElement) {
    const camera = createCamera();
    vec3.set(camera.position, 0, 0, 3);
    camera.updateViewMatrix();
    const cameraController = createFreeCameraController(canvas, camera);

    const lightPos = vec3.fromValues(1.2, 1.0, 2.0);

    const gpu = requestGPU();
    const adapter = await gpu.requestAdapter();
    const device = await adapter.requestDevice();

    const swapChainFormat: GPUTextureFormat = 'bgra8unorm';
    const swapChain = configureSwapChain(canvas, {
        device,
        format: swapChainFormat,
    });

    const cubeVB = createVertexBuffer(
        device,
        [
            {
                type: BufferAttributeType.Float3,
                location: 0,
            },
            {
                type: BufferAttributeType.Float3,
                location: 1,
            },
        ],
        CUBE_VERTICES_WITH_NORMALS,
    );

    const viewProjectionUBO = createUniformBuffer(device, {
        view: camera.viewMatrix,
        projection: camera.projectionMatrix,
    });

    // prettier-ignore
    const cubeVertexUBO = createUniformBuffer(device, {
        model: mat4.create()

        // // gouraud shading
        // light_color: [1.0, 1.0, 1.0],
        // light_pos: lightPos.value,
        // view_pos: camera.position.value,
    })

    const cubeFragmentUBO = createUniformBuffer(device, {
        // object_color: [1.0, 0.5, 0.31],

        // phong shading
        // light_color: [1.0, 1.0, 1.0],
        // light_pos: lightPos.value,
        view_pos: camera.position,

        // material system
        material: {
            ambient: [1.0, 0.5, 0.31],
            diffuse: [1.0, 0.5, 0.31],
            specular: [0.5, 0.5, 0.5],
            shininess: 32.0,
        },
        light: {
            position: lightPos,
            // ambient: [0.2, 0.2, 0.2],
            ambient: [1.0, 1.0, 1.0],
            // diffuse: [0.5, 0.5, 0.5],
            diffuse: [1.0, 1.0, 1.0],
            specular: [1.0, 1.0, 1.0],
        },
    });

    const glslang = await glslangModule();

    const cubeShader = createShader(device, glslang, {
        id: 0,
        vertex: cubePhongVert,
        fragment: cubePhongMaterialFrag,
        bindings: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                type: 'uniform-buffer',
                resource: viewProjectionUBO,
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                type: 'uniform-buffer',
                resource: cubeVertexUBO,
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                type: 'uniform-buffer',
                resource: cubeFragmentUBO,
            },
        ],
    });

    const cubeMeshRenderer = createMeshRenderer(device, cubeShader, cubeVB);

    // LIGHT
    const lightVB = createVertexBuffer(
        device,
        [
            {
                type: BufferAttributeType.Float3,
                location: 0,
            },
        ],
        CUBE_VERTICES,
    );

    const lightModelMatrix = mat4.create();
    mat4.translate(lightModelMatrix, lightModelMatrix, lightPos);
    mat4.scale(lightModelMatrix, lightModelMatrix, [0.2, 0.2, 0.2]);

    const lightVertexUBO = createUniformBuffer(device, {
        model: lightModelMatrix,
    });

    const lightFragmentUBO = createUniformBuffer(device, {
        light_color: [1.0, 1.0, 1.0],
    });

    const lightShader = createShader(device, glslang, {
        id: 1,
        vertex: lightVert,
        fragment: lightFrag,
        bindings: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                type: 'uniform-buffer',
                resource: viewProjectionUBO,
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                type: 'uniform-buffer',
                resource: lightVertexUBO,
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                type: 'uniform-buffer',
                resource: lightFragmentUBO,
            },
        ],
    });

    const lightMeshRenderer = createMeshRenderer(device, lightShader, lightVB);

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

        camera.updateViewMatrix();
        camera.updateProjectionMatrix();
        viewProjectionUBO.updateUniform('view', camera.viewMatrix);
        viewProjectionUBO.updateUniform('projection', camera.projectionMatrix);
        viewProjectionUBO.updateBuffer();

        lightRotation += delta;
        lightRotation %= 2 * Math.PI;

        vec3.set(
            lightPos,
            1.0 * Math.sin(lightRotation),
            1.0,
            1.0 * Math.cos(lightRotation),
        );
        mat4.fromRotationTranslationScale(
            lightModelMatrix,
            [0, 0, 0, 0],
            lightPos,
            [0.2, 0.2, 0.2],
        );
        lightVertexUBO.updateUniform('model', lightModelMatrix);
        lightVertexUBO.updateBuffer();

        // gouraud shading
        // cubeVertexUBO.updateUniform('light_pos', lightPos.value);
        // cubeVertexUBO.updateUniform('view_pos', camera.position.value);
        // cubeVertexUBO.updateBuffer();

        // phong shading
        cubeFragmentUBO.updateUniform('light.position', lightPos);
        cubeFragmentUBO.updateUniform('view_pos', camera.position);
        cubeFragmentUBO.updateBuffer();

        const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();

        const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(
            renderPassDescriptor,
        );
        passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
        passEncoder.setScissorRect(0, 0, canvas.width, canvas.height);

        cubeMeshRenderer.render(passEncoder);
        lightMeshRenderer.render(passEncoder);

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
        setMaterial(material: Material) {
            cubeFragmentUBO.updateUniform('material.ambient', material.ambient);
            cubeFragmentUBO.updateUniform('material.diffuse', material.diffuse);
            cubeFragmentUBO.updateUniform(
                'material.specular',
                material.specular,
            );
            cubeFragmentUBO.updateUniform(
                'material.shininess',
                material.shininess,
            );
        },
        destroy() {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }

            cameraController.destroy();

            viewProjectionUBO.destroy();

            cubeVertexUBO.destroy();
            cubeFragmentUBO.destroy();
            cubeVB.destroy();

            lightVertexUBO.destroy();
            lightFragmentUBO.destroy();
            lightVB.destroy();

            depthTexture.destroy();
        },
    };
}

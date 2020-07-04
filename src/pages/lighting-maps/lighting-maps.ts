import { PageOptions, WebGPUPage } from '../types';

import { vec3, mat4 } from 'gl-matrix';
import { createRenderer } from 'toolkit/webgpu/renderer';
import { createCamera, createFreeCameraController } from 'toolkit/camera';
import {
    createEntityManager,
    createBufferManager,
    createShaderManager,
    DefaultBuffers,
    createTextureManager,
} from 'toolkit/ecs';
import {
    createMovementSystem,
    createLightingSystem,
    createRenderSystem,
} from 'toolkit/ecs/systems';
import {
    createTransformComponent,
    createBasicMaterialComponent,
    createMeshGeometryComponent,
    createMaterialComponent,
} from 'toolkit/ecs/components';
import { getBasicShaderInfo } from 'toolkit/webgpu/shaders/basic-shader';
import { CUBE_VERTICES, CUBE_VERTICES_WITH_NORMALS_WITH_UV } from 'utils/cube-vertices';
import { BufferAttributeType, UniformType, UniformBuffer } from 'toolkit/webgpu/buffers';
import { Colors } from 'toolkit/materials';

import cubeVertSrc from './shader.vert';
import cubeFragSrc from './shader.frag';
import { ShaderBindingType } from 'toolkit/webgpu/shaders';

export async function create(canvas: HTMLCanvasElement, options: PageOptions): Promise<WebGPUPage> {
    const renderer = await createRenderer(canvas);

    const camera = createCamera();
    vec3.set(camera.position, 0, 0, 3);
    camera.updateViewMatrix();
    const cameraController = createFreeCameraController(canvas, camera);

    const entityManager = createEntityManager();
    const bufferManager = createBufferManager(renderer.device);
    const shaderManager = await createShaderManager(renderer.device);
    const textureManager = createTextureManager(renderer.device);

    const movementSystem = createMovementSystem(entityManager);
    const renderSystem = createRenderSystem(
        entityManager,
        shaderManager,
        bufferManager,
        renderer,
        camera,
    );

    // light
    const lightShader = shaderManager.create(getBasicShaderInfo(bufferManager));
    const lightPos = vec3.fromValues(1.2, 1.0, 2.0);
    const lightColor = {
        ambient: [0.2, 0.2, 0.2] as vec3,
        diffuse: [0.5, 0.5, 0.5] as vec3,
        specular: [1.0, 1.0, 1.0] as vec3,
    };

    const lightEntity = entityManager.create();
    entityManager.addComponent(
        lightEntity,
        createTransformComponent({
            translation: lightPos,
            scale: [0.1, 0.1, 0.1],
        }),
    );
    // entityManager.addComponent(
    //     lightEntity,
    //     createCircularMovementComponent({
    //         center: [0, 1.0, 0.0],
    //         axis: [0, 1, 0],
    //         radius: 1,
    //         period: 4,
    //     }),
    // );

    entityManager.addComponent(
        lightEntity,
        createBasicMaterialComponent({
            shader: lightShader,
            color: Colors.White,
        }),
    );
    entityManager.addComponent(
        lightEntity,
        createMeshGeometryComponent({
            buffers: [
                {
                    array: CUBE_VERTICES,
                    attributes: [
                        {
                            type: BufferAttributeType.Float3,
                            location: 0,
                        },
                    ],
                },
            ],
        }),
    );

    // cube
    const cubeEntity = entityManager.create();
    entityManager.addComponent(
        cubeEntity,
        createTransformComponent({
            translation: [0, 0, 0],
        }),
    );
    entityManager.addComponent(
        cubeEntity,
        createMeshGeometryComponent({
            buffers: [
                {
                    array: CUBE_VERTICES_WITH_NORMALS_WITH_UV,
                    attributes: [
                        {
                            type: BufferAttributeType.Float3,
                            location: 0,
                        },
                        {
                            type: BufferAttributeType.Float3,
                            location: 1,
                        },
                        {
                            type: BufferAttributeType.Float2,
                            location: 2,
                        },
                    ],
                },
            ],
        }),
    );

    const materialUniforms = {
        view_pos: camera.position,
        material: {
            specular: [0.5, 0.5, 0.5],
            shininess: 64,
        },
        light: {
            position: lightPos,
            ...lightColor,
        },
    };

    const viewProjectionBuffer = bufferManager.get<UniformBuffer>(DefaultBuffers.ViewProjection);
    const modelBuffer = bufferManager.createUniformBuffer(
        {
            model: UniformType.Mat4,
        },
        {
            model: mat4.create(),
        },
    );
    const materialBuffer = bufferManager.createUniformBuffer(
        {
            view_pos: UniformType.Vec3,
            material: {
                specular: UniformType.Vec3,
                shininess: UniformType.Scalar,
            },
            light: {
                position: UniformType.Vec3,
                ambient: UniformType.Vec3,
                diffuse: UniformType.Vec3,
                specular: UniformType.Vec3,
            },
        },

        materialUniforms,
    );
    const sampler = textureManager.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });
    const diffuseTexture = await textureManager.createTexture({
        uri: '/images/container-diffuse.png',
        usage: GPUTextureUsage.SAMPLED,
    });
    const specularTexture = await textureManager.createTexture({
        uri: '/images/container-specular.png',
        usage: GPUTextureUsage.SAMPLED,
    });
    const cubeShader = shaderManager.create({
        vertex: cubeVertSrc,
        fragment: cubeFragSrc,
        bindings: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                type: ShaderBindingType.UniformBuffer,
                resource: viewProjectionBuffer,
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                type: ShaderBindingType.UniformBuffer,
                resource: bufferManager.get(modelBuffer),
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                type: ShaderBindingType.UniformBuffer,
                resource: bufferManager.get(materialBuffer),
            },
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                type: ShaderBindingType.Sampler,
                resource: textureManager.getSampler(sampler),
            },
            {
                binding: 4,
                visibility: GPUShaderStage.FRAGMENT,
                type: ShaderBindingType.SampledTexture,
                resource: textureManager.getTexture(diffuseTexture).createView(),
            },
            {
                binding: 5,
                visibility: GPUShaderStage.FRAGMENT,
                type: ShaderBindingType.Sampler,
                resource: textureManager.getSampler(sampler),
            },
            {
                binding: 6,
                visibility: GPUShaderStage.FRAGMENT,
                type: ShaderBindingType.SampledTexture,
                resource: textureManager.getTexture(specularTexture).createView(),
            },
        ],
    });

    const cubeMaterialComponent = createMaterialComponent({
        shader: cubeShader,
        uniforms: materialUniforms,
    });
    entityManager.addComponent(cubeEntity, cubeMaterialComponent);

    let rafId = -1;
    let lastTime = performance.now();

    const { onRenderBegin = () => {}, onRenderFinish = () => {} } = options;
    function render() {
        onRenderBegin();

        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        cameraController.update(dt);

        // TODO: Dont do this every frame
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();

        movementSystem.update(dt);
        renderSystem.update();

        onRenderFinish();
        rafId = requestAnimationFrame(render);
    }
    render();

    return {
        destroy() {
            if (rafId > 0) {
                cancelAnimationFrame(rafId);
            }

            textureManager.destroy();
            bufferManager.destroy();

            cameraController.destroy();

            renderer.destroy();
        },
    };
}

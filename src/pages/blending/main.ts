import { PageOptions, WebGPUPage } from '../types';

import { vec3 } from 'gl-matrix';
import { createRenderer } from 'toolkit/webgpu/renderer';
import { createCamera, createFreeCameraController } from 'toolkit/camera';
import {
    createEntityManager,
    createBufferManager,
    createShaderManager,
    DefaultBuffers,
    createTextureManager,
} from 'toolkit/ecs';
import { createRenderSystem } from 'toolkit/ecs/systems';
import {
    createTransformComponent,
    createMeshGeometryComponent,
    createMaterialComponent,
} from 'toolkit/ecs/components';
import { CUBE_VERTICES_WITH_UV } from 'utils/cube-vertices';
import { BufferAttributeType, UniformBuffer, UniformType } from 'toolkit/webgpu/buffers';

import cubeVertSrc from './shader.vert';
import cubeFragSrc from './shader.frag';
import { ShaderBindingType, ShaderBinding } from 'toolkit/webgpu/shaders';

export async function create(canvas: HTMLCanvasElement, options: PageOptions): Promise<WebGPUPage> {
    const renderer = await createRenderer(canvas);
    renderer.clearColor = [0.1, 0.1, 0.1];

    const camera = createCamera();
    vec3.set(camera.position, 0, 0, 3);
    camera.updateViewMatrix();
    const cameraController = createFreeCameraController(canvas, camera);

    const entityManager = createEntityManager();
    const bufferManager = createBufferManager(renderer.device);
    const shaderManager = await createShaderManager(renderer.device);
    const textureManager = createTextureManager(renderer.device);

    const renderSystem = createRenderSystem(
        entityManager,
        shaderManager,
        bufferManager,
        renderer,
        camera,
    );

    const depthFunc: GPUCompareFunction = 'less';

    const viewProjectionBuffer = bufferManager.get<UniformBuffer>(DefaultBuffers.ViewProjection);

    const sampler = textureManager.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'repeat',
        addressModeV: 'repeat',
    });
    const marbleTexture = await textureManager.createTexture({
        uri: '/images/marble.jpg',
        usage: GPUTextureUsage.SAMPLED,
    });
    const metalTexture = await textureManager.createTexture({
        uri: '/images/metal.png',
        usage: GPUTextureUsage.SAMPLED,
    });

    const cubeVertexBufferDescriptor = {
        array: CUBE_VERTICES_WITH_UV,
        attributes: [
            {
                type: BufferAttributeType.Float3,
                location: 0,
            },
            {
                type: BufferAttributeType.Float2,
                location: 1,
            },
        ],
    };
    const cubeVertexBufferId = bufferManager.createVertexBuffer(cubeVertexBufferDescriptor);

    const cubePositions: vec3[] = [
        [-1.0, 0.0, -1.0],
        [2.0, 0.0, 0.0],
    ];

    let shaderId: number = -1;
    let bindings: ShaderBinding[] = [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            type: ShaderBindingType.UniformBuffer,
            resource: viewProjectionBuffer,
        },
        (undefined as unknown) as ShaderBinding,
        {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            type: ShaderBindingType.Sampler,
            resource: textureManager.getSampler(sampler),
        },
        {
            binding: 3,
            visibility: GPUShaderStage.FRAGMENT,
            type: ShaderBindingType.SampledTexture,
            resource: textureManager.getTexture(marbleTexture).createView(),
        },
    ];
    for (let i = 0; i < cubePositions.length; ++i) {
        const cubeEntity = entityManager.create();

        entityManager.addComponent(
            cubeEntity,
            createTransformComponent({
                translation: cubePositions[i],
            }),
        );

        entityManager.addComponent(
            cubeEntity,
            createMeshGeometryComponent({
                buffers: [
                    {
                        id: cubeVertexBufferId,
                        ...cubeVertexBufferDescriptor,
                    },
                ],
            }),
        );
        const modelBuffer = bufferManager.createUniformBuffer({
            model: UniformType.Mat4,
        });

        bindings[1] = {
            binding: 1,
            visibility: GPUShaderStage.VERTEX,
            type: ShaderBindingType.UniformBuffer,
            resource: bufferManager.get(modelBuffer),
        };

        if (shaderId !== -1) {
            shaderId = shaderManager.clone(shaderId, bindings);
        } else {
            shaderId = shaderManager.create({
                vertex: cubeVertSrc,
                fragment: cubeFragSrc,
                bindings,
            });
        }
        const cubeMaterialComponent = createMaterialComponent({
            shader: shaderId,
            uniforms: {},
        });
        const shader = shaderManager.get(shaderId);
        shader.depthFunc = depthFunc;
        entityManager.addComponent(cubeEntity, cubeMaterialComponent);
    }

    // prettier-ignore
    const planeVertices = [
        // positions       // texture Coords (note we set these higher than 1 (together with GL_REPEAT as texture wrapping mode). this will cause the loor texture to repeat)
         5.0, -0.5,  5.0,  2.0, 0.0,
        -5.0, -0.5,  5.0,  0.0, 0.0,
        -5.0, -0.5, -5.0,  0.0, 2.0,

         5.0, -0.5,  5.0,  2.0, 0.0,
        -5.0, -0.5, -5.0,  0.0, 2.0,
         5.0, -0.5, -5.0,  2.0, 2.0
    ];

    const planeEntity = entityManager.create();
    entityManager.addComponent(planeEntity, createTransformComponent({}));

    entityManager.addComponent(
        planeEntity,
        createMeshGeometryComponent({
            buffers: [
                {
                    array: Float32Array.from(planeVertices),
                    attributes: [
                        {
                            type: BufferAttributeType.Float3,
                            location: 0,
                        },
                        {
                            type: BufferAttributeType.Float2,
                            location: 1,
                        },
                    ],
                },
            ],
        }),
    );

    const modelBuffer = bufferManager.createUniformBuffer({
        model: UniformType.Mat4,
    });
    bindings[1] = {
        binding: 1,
        visibility: GPUShaderStage.VERTEX,
        type: ShaderBindingType.UniformBuffer,
        resource: bufferManager.get(modelBuffer),
    };
    bindings[3] = {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        type: ShaderBindingType.SampledTexture,
        resource: textureManager.getTexture(metalTexture).createView(),
    };

    shaderId = shaderManager.clone(shaderId, bindings);
    const shader = shaderManager.get(shaderId);
    shader.depthFunc = depthFunc;
    entityManager.addComponent(
        planeEntity,
        createMaterialComponent({
            shader: shaderId,
            uniforms: {},
        }),
    );

    const vegetation: vec3[] = [
        [-1.5, 0.0, -0.48],
        [1.5, 0.0, 0.51],
        [0.0, 0.0, 0.7],
        [-0.3, 0.0, -2.3],
        [0.5, 0.0, -0.6],
    ];

    const vegetationBufferDescriptor = {
        // prettier-ignore
        array: Float32Array.from([
            // positions      // texture Coords (swapped y coordinates because texture is flipped upside down)
            0.0,  0.5,  0.0,  0.0,  1.0,
            0.0, -0.5,  0.0,  0.0,  0.0,
            1.0, -0.5,  0.0,  1.0,  0.0,

            0.0,  0.5,  0.0,  0.0,  1.0,
            1.0, -0.5,  0.0,  1.0,  0.0,
            1.0,  0.5,  0.0,  1.0,  1.0
        ]),
        attributes: [
            {
                type: BufferAttributeType.Float3,
                location: 0,
            },
            {
                type: BufferAttributeType.Float2,
                location: 1,
            },
        ],
    };

    const vegSampler = textureManager.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
    });
    // const grassTexture = await textureManager.createTexture({
    //     uri: '/images/grass.png',
    //     usage: GPUTextureUsage.SAMPLED,
    // });
    const windowTexture = await textureManager.createTexture({
        uri: '/images/transparent-window.png',
        usage: GPUTextureUsage.SAMPLED,
    });
    bindings = [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            type: ShaderBindingType.UniformBuffer,
            resource: viewProjectionBuffer,
        },
        (undefined as unknown) as ShaderBinding,
        {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            type: ShaderBindingType.Sampler,
            resource: textureManager.getSampler(vegSampler),
        },
        {
            binding: 3,
            visibility: GPUShaderStage.FRAGMENT,
            type: ShaderBindingType.SampledTexture,
            // resource: textureManager.getTexture(grassTexture).createView(),
            resource: textureManager.getTexture(windowTexture).createView(),
        },
    ];
    const vegetationBuffId = bufferManager.createVertexBuffer(vegetationBufferDescriptor);
    for (let i = 0; i < vegetation.length; ++i) {
        const entityId = entityManager.create();
        entityManager.addComponent(
            entityId,
            createTransformComponent({
                translation: vegetation[i],
            }),
        );

        entityManager.addComponent(
            entityId,
            createMeshGeometryComponent({
                buffers: [
                    {
                        id: vegetationBuffId,
                        ...vegetationBufferDescriptor,
                    },
                ],
            }),
        );

        const modelBuffer = bufferManager.createUniformBuffer({
            model: UniformType.Mat4,
        });
        bindings[1] = {
            binding: 1,
            visibility: GPUShaderStage.VERTEX,
            type: ShaderBindingType.UniformBuffer,
            resource: bufferManager.get(modelBuffer),
        };

        shaderId = shaderManager.clone(shaderId, bindings);
        entityManager.addComponent(
            entityId,
            createMaterialComponent({
                shader: shaderId,
                uniforms: {},
            }),
        );
    }

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
            shaderManager.destroy();
            bufferManager.destroy();
            entityManager.destroy();

            cameraController.destroy();
        },
    };
}

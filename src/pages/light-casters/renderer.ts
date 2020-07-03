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
    // createCircularMovementComponent,
    // createLightComponent,
    createBasicMaterialComponent,
    createMeshGeometryComponent,
    createMaterialComponent,
    // createDirectionalLightComponent,
    createPointLightComponent,
    createSpotLightComponent,
} from 'toolkit/ecs/components';
import { getBasicShaderInfo } from 'toolkit/webgpu/shaders/basic-shader';
import {
    CUBE_VERTICES,
    CUBE_VERTICES_WITH_NORMALS_WITH_UV,
} from 'utils/cube-vertices';
import { BufferAttributeType, UniformBuffer } from 'toolkit/webgpu/buffers';
import { Colors } from 'toolkit/materials';

import cubeVertSrc from './shader.vert';
import cubeFragSrc from './shader.frag';
import { radians } from 'toolkit/math';
import { ShaderBindingType, ShaderBinding } from 'toolkit/webgpu/shaders';
import { createFlashlightSystem } from './flashlight';

export async function create(
    canvas: HTMLCanvasElement,
    options: PageOptions,
): Promise<WebGPUPage> {
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
    const lightingSystem = createLightingSystem(entityManager);
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
    // const lightDir = vec3.fromValues(-0.2, -1.0, -0.3);

    const lightColor = {
        ambient: [0.2, 0.2, 0.2] as vec3,
        diffuse: [0.5, 0.5, 0.5] as vec3,
        specular: [1.0, 1.0, 1.0] as vec3,
    };
    // const directionalLightDescriptor = {
    //     direction: lightDir,
    //     ...lightColor,
    // };
    // const pointLightDescriptor = {
    //     position: lightPos,
    //     constant: 1.0,
    //     linear: 0.09,
    //     quadratic: 0.032,
    //     ...lightColor,
    // };
    //
    const spotLightDescriptor = {
        position: camera.position,
        direction: camera.direction,
        innerCutoff: Math.cos(radians(12.5)),
        outerCutoff: Math.cos(radians(17.5)),
        ...lightColor,
    };

    const lightEntity = entityManager.create();
    entityManager.addComponent(
        lightEntity,
        createTransformComponent({
            translation: lightPos,
            scale: [0.1, 0.1, 0.1],
        }),
    );
    entityManager.addComponent(
        lightEntity,
        // createDirectionalLightComponent(directionalLightDescriptor),
        // createPointLightComponent(pointLightDescriptor),
        createSpotLightComponent(spotLightDescriptor),
    );
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

    const flashlightSystem = createFlashlightSystem(
        lightEntity,
        entityManager,
        camera,
    );

    // cubes
    const materialUniforms = {
        view_pos: camera.position,
        material: {
            shininess: 64,
        },
        light: {
            // ...directionalLightDescriptor,
            // ...pointLightDescriptor,
            ...spotLightDescriptor,
        },
    };

    const viewProjectionBuffer = bufferManager.get<UniformBuffer>(
        DefaultBuffers.ViewProjection,
    );
    const materialBuffer = bufferManager.createUniformBuffer(materialUniforms);
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

    const cubeVertexBufferDescriptor = {
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
    };
    const cubeVertexBufferId = bufferManager.createVertexBuffer(
        cubeVertexBufferDescriptor,
    );

    const cubePositions: vec3[] = [
        [0.0, 0.0, 0.0],
        [2.0, 5.0, -15.0],
        [-1.5, -2.2, -2.5],
        [-3.8, -2.0, -12.3],
        [2.4, -0.4, -3.5],
        [-1.7, 3.0, -7.5],
        [1.3, -2.0, -2.5],
        [1.5, 2.0, -2.5],
        [1.5, 0.2, -1.5],
        [-1.3, 1.0, -1.5],
    ];

    let cubeShader: number = -1;
    for (let i = 0; i < cubePositions.length; ++i) {
        const cubeEntity = entityManager.create();
        const angle = 20.0 * i;

        entityManager.addComponent(
            cubeEntity,
            createTransformComponent({
                translation: cubePositions[i],
                rotation: {
                    angle: radians(angle),
                    axis: [1.0, 0.3, 0.5],
                },
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
            model: mat4.create(),
        });
        const bindings: ShaderBinding[] = [
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
                resource: textureManager
                    .getTexture(diffuseTexture)
                    .createView(),
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
                resource: textureManager
                    .getTexture(specularTexture)
                    .createView(),
            },
        ];
        if (cubeShader !== -1) {
            cubeShader = shaderManager.clone(cubeShader, bindings);
        } else {
            cubeShader = shaderManager.create({
                vertex: cubeVertSrc,
                fragment: cubeFragSrc,
                bindings,
            });
        }
        const cubeMaterialComponent = createMaterialComponent({
            shader: cubeShader,
            uniforms: materialUniforms,
        });
        entityManager.addComponent(cubeEntity, cubeMaterialComponent);
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

        flashlightSystem.update();

        movementSystem.update(dt);
        lightingSystem.update();
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
        },
    };
}

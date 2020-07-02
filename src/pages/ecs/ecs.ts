import {
    createEntityManager,
    createBufferManager,
    createShaderManager,
    DefaultBuffers,
} from 'toolkit/ecs';
import {
    createRenderSystem,
    createMovementSystem,
    createLightingSystem,
} from 'toolkit/ecs/systems';
import {
    createTransformComponent,
    createBasicMaterialComponent,
    createMaterialComponent,
    createLightComponent,
    createMeshGeometryComponent,
    createCircularMovementComponent,
} from 'toolkit/ecs/components';
import { CUBE_VERTICES, CUBE_NORMALS } from 'utils/cube-vertices';
import { BufferAttributeType } from 'toolkit/webgpu/buffers';
import { createRenderer } from 'toolkit/webgpu/renderer';
import { createCamera, createFreeCameraController } from 'toolkit/camera';
import { vec3, mat4 } from 'gl-matrix';
import { Colors } from 'toolkit/materials/color';
import { getBasicShaderInfo } from 'toolkit/webgpu/shaders/basic-shader';
import phongVertex from '../../rendering/shaders/phong.vert';
import phongFrag from '../../rendering/shaders/phong.frag';
import { CommonMaterials } from 'toolkit/materials';

import * as dat from 'dat.gui';

export async function create(canvas: HTMLCanvasElement, options: any) {
    const renderer = await createRenderer(canvas);

    const camera = createCamera();
    vec3.set(camera.position, 0, 0, 3);
    camera.updateViewMatrix();
    const cameraController = createFreeCameraController(canvas, camera);

    const entityManager = createEntityManager();
    const bufferManager = createBufferManager(renderer.device);
    const shaderManager = await createShaderManager(renderer.device);

    const movementSystem = createMovementSystem(entityManager);
    const lightingSystem = createLightingSystem(entityManager);
    const renderSystem = createRenderSystem(
        entityManager,
        shaderManager,
        bufferManager,
        renderer,
        camera,
    );

    // TODO: Shaders should be shareable. To do that, they should need
    // to share the layout (since they have the same source), but the
    // uniform buffers need to be unique (other than shared buffers)
    const lightShader = shaderManager.create(getBasicShaderInfo(bufferManager));

    const lightPos = vec3.fromValues(1.2, 1.0, 2.0);
    const lightColor = {
        ambient: [1.0, 1.0, 1.0] as vec3,
        diffuse: [1.0, 1.0, 1.0] as vec3,
        specular: [1.0, 1.0, 1.0] as vec3,
    };

    const viewProjectionBuffer = bufferManager.get(
        DefaultBuffers.ViewProjection,
    );
    const modelBuffer = bufferManager.createUniformBuffer({
        model: mat4.create(),
    });
    const materialUniforms = {
        view_pos: camera.position,
        material: {
            ambient: [0.0215, 0.1745, 0.0215],
            diffuse: [0.07568, 0.61424, 0.07568],
            specular: [0.633, 0.727811, 0.633],
            shininess: 0.6 * 128,
        },
        light: {
            position: lightPos,
            ...lightColor,
        },
    };
    const materialBuffer = bufferManager.createUniformBuffer(materialUniforms);
    const cubeShader = shaderManager.create({
        vertex: phongVertex,
        fragment: phongFrag,
        bindings: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                type: 'uniform-buffer',
                resource: viewProjectionBuffer,
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                type: 'uniform-buffer',
                resource: bufferManager.get(modelBuffer),
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                type: 'uniform-buffer',
                resource: bufferManager.get(materialBuffer),
            },
        ],
    });

    const lightEntity = entityManager.create();
    entityManager.addComponent(
        lightEntity,
        createTransformComponent({
            translation: [1.2, 1.0, 2.0],
            scale: [0.1, 0.1, 0.1],
        }),
    );
    entityManager.addComponent(
        lightEntity,
        createCircularMovementComponent({
            center: [0, 1.0, 0.0],
            axis: [0, 1, 0],
            radius: 1,
            period: 4,
        }),
    );
    entityManager.addComponent(
        lightEntity,
        createLightComponent({
            ...lightColor,
        }),
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
                    array: CUBE_VERTICES,
                    attributes: [
                        {
                            type: BufferAttributeType.Float3,
                            location: 0,
                        },
                    ],
                },
                {
                    array: CUBE_NORMALS,
                    attributes: [
                        {
                            type: BufferAttributeType.Float3,
                            location: 1,
                        },
                    ],
                },
            ],
        }),
    );

    const cubeMaterialComponent = createMaterialComponent({
        shader: cubeShader,
        uniforms: materialUniforms,
    });
    entityManager.addComponent(cubeEntity, cubeMaterialComponent);

    let rafId: number;
    let lastTime = performance.now();
    function render() {
        options.onRenderBegin();

        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        cameraController.update(dt);

        // TODO: Dont do this every frame
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();

        movementSystem.update(dt);
        lightingSystem.update();
        renderSystem.update();

        options.onRenderFinish();
        rafId = requestAnimationFrame(render);
    }
    render();

    const model = {
        material: Object.keys(CommonMaterials)[0],
    };
    const gui = new dat.GUI();
    const materialSelectionController = gui.add(
        model,
        'material',
        Object.keys(CommonMaterials),
    );
    materialSelectionController.onChange((material: string) => {
        cubeMaterialComponent.uniforms.material = CommonMaterials[material];
    });

    return {
        destroy() {
            if (rafId > 0) {
                cancelAnimationFrame(rafId);
            }

            gui.destroy();

            cameraController.destroy();
            bufferManager.destroy();
        },
    };
}

import { createEntityManager } from 'toolkit/ecs/entity-manager';
import { createRenderSystem } from 'toolkit/ecs/rendering-system';
import {
    createTransformComponent,
    createBasicMaterialComponent,
} from 'toolkit/ecs/components';
import { createMeshGeometryComponent } from 'toolkit/ecs/components/geometry';
import { CUBE_VERTICES, CUBE_NORMALS } from 'utils/cube-vertices';
import { BufferAttributeType } from 'toolkit/rendering/buffers';
import { createShaderManager } from 'toolkit/rendering/shaders';
import { createRenderer } from 'toolkit/rendering/renderer';
import { createBufferManager } from 'toolkit/ecs/buffer-manager';
import { createCamera } from 'toolkit/camera/camera';
import { createFreeCameraController } from 'toolkit/camera/free-camera-controller';
import { vec3 } from 'gl-matrix';

export async function create(canvas: HTMLCanvasElement) {
    const renderer = await createRenderer(canvas);

    const camera = createCamera();
    vec3.set(camera.position, 0, 0, 3);
    camera.updateViewMatrix();
    const cameraController = createFreeCameraController(canvas, camera);

    const entityManager = createEntityManager();
    const bufferManager = createBufferManager(renderer.device);
    const shaderManager = await createShaderManager(
        renderer.device,
        bufferManager,
    );

    const renderSystem = createRenderSystem(
        entityManager,
        shaderManager,
        bufferManager,
        renderer,
        camera,
    );
    //
    // const cubeVertices = [];
    // const cubeNormals = [];

    // const lightEntity = entityManager.create();
    // entityManager.addComponent(
    //     lightEntity,
    //     createTransformComponent({
    //         position: [1.2, 1.0, 2.0],
    //         scale: [0.1, 0.1, 0.1],
    //     }),
    // );
    // entityManager.addComponent(
    //     lightEntity,
    //     createCircularMovementComponent({
    //         center: [0, 0, 0],
    //         radius: 2,
    //         speed: Math.PI,
    //     }),
    // );
    // entityManager.addComponent(
    //     lightEntity,
    //     createMeshGeometryComponent({
    //         attributes: [
    //             {
    //                 array: cubeVertices,
    //                 type: 'float3',
    //             },
    //         ],
    //     }),
    // );

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
    entityManager.addComponent(cubeEntity, createBasicMaterialComponent());

    // const movingCube = entityManager.create();
    // entityManager.addComponent(
    //     movingCube,
    //     createTransformComponent({
    //         position: [0, -1.2, 0],
    //     }),
    // );
    // entityManager.addComponent(
    //     movingCube,
    //     createLinearMovementComponent({
    //
    //     })
    // )
    // entityManager.addComponent(
    //     lightEntity,
    //     createMeshGeometryComponent({
    //         buffers: [
    //             {
    //                 array: CUBE_VERTICES_WITH_NORMALS,
    //                 attributes: [
    //                     {
    //                         type: 'float3',
    //                     },
    //                     {
    //                         type: 'float3',
    //                     },
    //                 ],
    //             },
    //         ],
    //     }),
    // );

    let rafId: number;
    let lastTime = performance.now();
    function render() {
        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        cameraController.update(dt);

        // TODO: Dont do this every frame
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();

        // movementSystem.update(dt);
        renderSystem.update();

        rafId = requestAnimationFrame(render);
    }
    render();

    return {
        destroy() {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }

            cameraController.destroy();
        },
    };
}

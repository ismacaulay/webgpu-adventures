import { ShaderManager } from 'toolkit/rendering/shaders';
import { Camera } from 'toolkit/camera/camera';
import { Renderer, CommandType } from 'toolkit/rendering/renderer';
import { UniformBuffer, VertexBuffer } from 'toolkit/rendering/buffers';
import { EntityManager } from './entity-manager';
import {
    ComponentType,
    TransformComponent,
    MaterialComponent,
    GeometryComponent,
} from './components';
import { BufferManager, DefaultBuffers } from './buffer-manager';

export function createRenderSystem(
    entityManager: EntityManager,
    shaderManager: ShaderManager,
    bufferManager: BufferManager,
    renderer: Renderer,
    camera: Camera,
) {
    return {
        update() {
            renderer.begin();

            const viewProjectionBuffer = bufferManager.get<UniformBuffer>(
                DefaultBuffers.ViewProjection,
            );
            viewProjectionBuffer.updateUniform('view', camera.viewMatrix);
            viewProjectionBuffer.updateUniform(
                'projection',
                camera.projectionMatrix,
            );
            renderer.submit({
                type: CommandType.CopySrcToDst,
                src: viewProjectionBuffer.data,
                dst: viewProjectionBuffer.buffer,
                size: viewProjectionBuffer.data.byteLength,
            });
            viewProjectionBuffer.needsUpdate = false;

            // TODO: Implement a way to submit buffer updates and prevent
            //       the shader from submitting it when its already submitted

            const view = entityManager.view([
                ComponentType.Transform,
                ComponentType.Geometry,
                ComponentType.Material,
            ]);

            let result = view.next();
            while (!result.done) {
                const transform = result.value[0] as TransformComponent;
                const geometry = result.value[1] as GeometryComponent;
                const material = result.value[2] as MaterialComponent;

                const vbs = geometry.buffers.map(buffer => {
                    if (!buffer.id) {
                        buffer.id = bufferManager.createVertexBuffer(buffer);
                    }

                    return bufferManager.get<VertexBuffer>(buffer.id);
                });

                const shader = shaderManager.get(material.shader);
                shader.update({ model: transform.matrix });
                shader.update(material.uniforms);

                shader.buffers.forEach((buffer: UniformBuffer) => {
                    if (buffer.needsUpdate) {
                        renderer.submit({
                            type: CommandType.CopySrcToDst,
                            src: buffer.data,
                            dst: buffer.buffer,
                            size: buffer.data.byteLength,
                        });

                        buffer.needsUpdate = false;
                    }
                });

                renderer.submit({
                    type: CommandType.Draw,
                    shader,
                    buffers: vbs,
                    count: geometry.count,
                });

                result = view.next();
            }

            renderer.finish();
        },
    };
}

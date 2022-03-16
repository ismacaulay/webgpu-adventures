import { vec3 } from 'gl-matrix';
import type { CameraController } from 'toolkit/types/camera';
import {
  ComponentType,
  GeometryComponent,
  MaterialComponent,
  ShaderId,
  TransformComponent,
} from 'toolkit/types/ecs/components';
import {
  BufferManager,
  DefaultBuffers,
  EntityManager,
  ShaderManager,
} from 'toolkit/types/ecs/managers';
import type { RenderSystem } from 'toolkit/types/ecs/systems';
import type { IndexBuffer, UniformBuffer, VertexBuffer } from 'toolkit/types/webgpu/buffers';
import { RenderCommandType, Renderer } from 'toolkit/types/webgpu/renderer';
import type { PostProcessingShader, Shader } from 'toolkit/types/webgpu/shaders';

export function createRenderSystem(
  renderer: Renderer,
  cameraController: CameraController,
  managers: {
    entityManager: EntityManager;
    bufferManager: BufferManager;
    shaderManager: ShaderManager;
  },
): RenderSystem {
  const { entityManager, bufferManager, shaderManager } = managers;
  const _tmp = vec3.create();

  const postProcessingDescriptors: { shader: ShaderId }[] = [];

  return {
    update() {
      renderer.begin();

      const matricesBuffer = bufferManager.get<UniformBuffer>(DefaultBuffers.ViewProjection);
      const camera = cameraController.camera;
      matricesBuffer.updateUniforms({
        view: camera.view,
        projection: camera.projection,
      });

      // TODO: only write if the buffer is dirty
      renderer.submit({
        type: RenderCommandType.WriteBuffer,
        src: matricesBuffer.data,
        dst: matricesBuffer.buffer,
      });

      const entities = entityManager.all([
        ComponentType.Transform,
        ComponentType.Geometry,
        ComponentType.Material,
      ]);
      entities.sort((a, b) => {
        const drawOrder =
          (a[2] as MaterialComponent).drawOrder - (b[2] as MaterialComponent).drawOrder;
        if (drawOrder !== 0) {
          return drawOrder;
        }

        return (
          vec3.length(vec3.sub(_tmp, camera.position, (b[0] as TransformComponent).translation)) -
          vec3.length(vec3.sub(_tmp, camera.position, (a[0] as TransformComponent).translation))
        );
      });

      for (let i = 0; i < entities.length; ++i) {
        const result = entities[i];
        const transform = result[0] as TransformComponent;
        const geometry = result[1] as GeometryComponent;
        const material = result[2] as MaterialComponent;

        const vertexBuffers = geometry.buffers.map((buffer) => {
          // TODO: should the buffers on the geometry have a needsUpdate?
          if (!buffer.id) {
            buffer.id = bufferManager.createVertexBuffer(buffer);
          } else if (geometry.needsUpdate) {
            renderer.submit({
              type: RenderCommandType.WriteBuffer,
              src: buffer.array,
              dst: bufferManager.get<VertexBuffer>(buffer.id).buffer,
            });
          }

          return bufferManager.get<VertexBuffer>(buffer.id);
        });

        let indices: IndexBuffer | undefined = undefined;
        if (geometry.indices) {
          if (!geometry.indices.id) {
            geometry.indices.id = bufferManager.createIndexBuffer(geometry.indices);
          } else if (geometry.needsUpdate) {
            renderer.submit({
              type: RenderCommandType.WriteBuffer,
              src: geometry.indices.array,
              dst: bufferManager.get<VertexBuffer>(geometry.indices.id).buffer,
            });
          }

          indices = bufferManager.get<IndexBuffer>(geometry.indices.id);
        }

        const shader = shaderManager.get<Shader>(material.shader);

        if (transform.needsUpdate) {
          shader.update({ model: transform.matrix });
          transform.needsUpdate = false;
        }
        if (material.needsUpdate) {
          shader.update(material.uniforms ?? {});
          material.needsUpdate = false;
        }
        shader.buffers.forEach((buf) => {
          if (buf.needsUpdate) {
            renderer.submit({
              type: RenderCommandType.WriteBuffer,
              src: buf.data,
              dst: buf.buffer,
            });
            buf.needsUpdate = false;
          }
        });

        shader.textures.forEach((texture) => {
          if (texture.needsUpdate) {
            renderer.submit({
              type: RenderCommandType.CopyToTexture,
              src: texture.data,
              dst: texture.texture,
            });
            texture.needsUpdate = false;
          }
        });

        renderer.submit({
          type: RenderCommandType.Draw,
          shader,
          indices,
          buffers: vertexBuffers,
          count: geometry.count,
          priority: material.drawOrder,
        });

        geometry.needsUpdate = false;
      }

      for (let i = 0; i < postProcessingDescriptors.length; ++i) {
        renderer.submit({
          type: RenderCommandType.PostProcessing,
          shader: shaderManager.get<PostProcessingShader>(postProcessingDescriptors[i].shader),
        });
      }

      renderer.finish();
    },

    addPostProcessing(descriptor: { shader: ShaderId }) {
      postProcessingDescriptors.push(descriptor);
    },
    removePostProcessing(descriptor: { shader: ShaderId }) {
      const idx = postProcessingDescriptors.indexOf(descriptor);
      if (idx === -1) {
        console.warn('Failed to remove unknown post processing descriptor: ', descriptor);
        return;
      }

      postProcessingDescriptors.splice(idx, 1);
    },
  };
}

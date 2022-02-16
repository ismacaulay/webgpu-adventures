import { mat4 } from 'gl-matrix';
import type { CameraController } from 'toolkit/types/camera';
import {
  ComponentType,
  GeometryComponent,
  MaterialComponent,
  TransformComponent,
} from 'toolkit/types/ecs/components';
import {
  BufferManager,
  DefaultBuffers,
  EntityManager,
  ShaderManager,
} from 'toolkit/types/ecs/managers';
import type { IndexBuffer, UniformBuffer, VertexBuffer } from 'toolkit/types/webgpu/buffers';
import { RenderCommandType, Renderer } from 'toolkit/types/webgpu/renderer';

// export function createRenderSystemOld(
//   entityManager: EntityManager,
//   shaderManager: ShaderManager,
//   bufferManager: BufferManager,
//   renderer: Renderer,
//   camera: Came,
// ) {
//   return {
//     update() {
//       renderer.begin();

//       const viewProjectionBuffer = bufferManager.get<UniformBuffer>(DefaultBuffers.ViewProjection);
//       viewProjectionBuffer.updateUniform('view', camera.viewMatrix);
//       viewProjectionBuffer.updateUniform('projection', camera.projectionMatrix);
//       renderer.submit({
//         type: RenderCommandType.CopySrcToDst,
//         src: viewProjectionBuffer.data,
//         dst: viewProjectionBuffer.buffer,
//         size: viewProjectionBuffer.data.byteLength,
//       });
//       viewProjectionBuffer.needsUpdate = false;

//       // TODO: Implement a way to submit buffer updates and prevent
//       //       the shader from submitting it when its already submitted

//       const view = entityManager.view([
//         ComponentType.Transform,
//         ComponentType.Geometry,
//         ComponentType.Material,
//       ]);

//       let result = view.next();
//       while (!result.done) {
//         const transform = result.value[0] as TransformComponent;
//         const geometry = result.value[1] as GeometryComponent;
//         const material = result.value[2] as MaterialComponent;

//         const vbs = geometry.buffers.map((buffer) => {
//           if (!buffer.id) {
//             buffer.id = bufferManager.createVertexBuffer(buffer);
//           }

//           return bufferManager.get<VertexBuffer>(buffer.id);
//         });

//         const shader = shaderManager.get(material.shader);
//         shader.update({ model: transform.matrix });
//         shader.update(material.uniforms);

//         shader.buffers.forEach((buffer: UniformBuffer) => {
//           if (buffer.needsUpdate) {
//             renderer.submit({
//               type: RenderCommandType.CopySrcToDst,
//               src: buffer.data,
//               dst: buffer.buffer,
//               size: buffer.data.byteLength,
//             });

//             buffer.needsUpdate = false;
//           }
//         });

//         renderer.submit({
//           type: RenderCommandType.Draw,
//           priority: material.drawOrder,
//           shader,
//           buffers: vbs,
//           count: geometry.count,
//         });

//         result = view.next();
//       }

//       renderer.finish();
//     },
//   };
// }

export function createRenderSystem(
  renderer: Renderer,
  cameraController: CameraController,
  managers: {
    entityManager: EntityManager;
    bufferManager: BufferManager;
    shaderManager: ShaderManager;
  },
) {
  const { entityManager, bufferManager, shaderManager } = managers;

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
          }

          indices = bufferManager.get<IndexBuffer>(geometry.indices.id);
        }

        const shader = shaderManager.get(material.shader);

        if (transform.needsUpdate) {
          shader.update({ model: transform.matrix });
          transform.needsUpdate = false;
        }
        // shader.update(material.uniforms);
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
        });

        geometry.needsUpdate = false;

        result = view.next();
      }

      renderer.finish();
    },
  };
}

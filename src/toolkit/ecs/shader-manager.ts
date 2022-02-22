import type { ShaderId } from 'toolkit/types/ecs/components';
import {
  BufferManager,
  DefaultBuffers,
  ShaderManager,
  TextureManager,
} from 'toolkit/types/ecs/managers';
import type { Storage } from 'toolkit/types/generic';
import type { UniformBuffer } from 'toolkit/types/webgpu/buffers';
import {
  PostProcessingShader,
  Shader,
  ShaderBindingDescriptor,
  ShaderBindingType,
  ShaderDescriptor,
  ShaderType,
} from 'toolkit/types/webgpu/shaders';
import type { Texture } from 'toolkit/types/webgpu/textures';
import { cloneShader, createPostProcessingShader, createShader } from 'toolkit/webgpu/shaders';

function processBindings(
  bindings: ShaderBindingDescriptor[],
  {
    bufferManager,
    textureManager,
  }: { bufferManager: BufferManager; textureManager: TextureManager },
) {
  const uniformBuffers: UniformBuffer[] = [];
  let textures: Texture[] = [];
  const processed = [
    {
      entries: bindings.map((binding) => {
        if (binding.type === ShaderBindingType.UniformBuffer) {
          const buffer = bufferManager.get<UniformBuffer>(binding.resource);
          // only include non default buffers
          if (binding.resource >= DefaultBuffers.Count) {
            uniformBuffers.push(buffer);
          }
          return {
            resource: {
              buffer: buffer.buffer,
            },
          };
        } else if (binding.type === ShaderBindingType.Sampler) {
          return {
            resource: textureManager.get<GPUSampler>(binding.resource),
          };
        } else {
          const texture = textureManager.get<Texture>(binding.resource);
          textures.push(texture);

          return {
            resource: texture.texture.createView(),
          };
        }
      }),
    },
  ];

  return { bindings: processed, textures, uniformBuffers };
}

export function createShaderManager(
  device: GPUDevice,
  {
    bufferManager,
    textureManager,
  }: { bufferManager: BufferManager; textureManager: TextureManager },
): ShaderManager {
  let storage: Storage<Shader | PostProcessingShader> = {};
  let next = 0;

  return {
    create(descriptor: ShaderDescriptor) {
      if ('bindings' in descriptor) {
        const { bindings, textures, uniformBuffers } = processBindings(descriptor.bindings, {
          bufferManager,
          textureManager,
        });

        storage[next] = createShader(next, device, descriptor, bindings, uniformBuffers, textures);
      } else {
        storage[next] = createPostProcessingShader(next, device, descriptor);
      }
      return next++;
    },

    get<T extends Shader | PostProcessingShader>(id: ShaderId) {
      const shader = storage[id];
      if (!shader) {
        throw new Error(`Unknown shader id: ${id}`);
      }

      return shader as T;
    },

    clone(id: number, bindingDescriptors: ShaderBindingDescriptor[]) {
      const shader = storage[id];
      if (!shader) {
        throw new Error(`Unknown shader: ${id}`);
      }

      if (shader.type !== ShaderType.Render) {
        throw new Error(`Unable to clone non render shaders: ${shader.type}`);
      }

      const { bindings, textures, uniformBuffers } = processBindings(bindingDescriptors, {
        bufferManager,
        textureManager,
      });

      storage[next] = cloneShader(shader, bindings, textures, uniformBuffers);
      storage[next].id = next;
      return next++;
    },

    destroy() {
      storage = {};
    },
  };
}

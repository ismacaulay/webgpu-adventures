import type { ShaderId } from 'toolkit/types/ecs/components';
import {
  BufferManager,
  DefaultBuffers,
  ShaderManager,
  TextureManager,
} from 'toolkit/types/ecs/managers';
import type { Storage } from 'toolkit/types/generic';
import type { UniformBuffer } from 'toolkit/types/webgpu/buffers';
import { ShaderBindingType, ShaderDescriptor } from 'toolkit/types/webgpu/shaders';
import type { Texture } from 'toolkit/types/webgpu/textures';
import { createShader } from 'toolkit/webgpu/shaders';

export function createShaderManager(
  device: GPUDevice,
  {
    bufferManager,
    textureManager,
  }: { bufferManager: BufferManager; textureManager: TextureManager },
): ShaderManager {
  let storage: Storage<any> = {};
  let next = 0;

  return {
    create(descriptor: ShaderDescriptor) {
      const uniformBuffers: any[] = [];
      let textures: any[] = [];
      const bindings = [
        {
          entries: descriptor.bindings.map((binding) => {
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
      const shader = createShader(next, device, descriptor, bindings, uniformBuffers, textures);
      storage[next] = shader;
      return next++;
    },

    get(id: ShaderId) {
      const shader = storage[id];
      if (!shader) {
        throw new Error(`Unknown shader id: ${id}`);
      }

      return shader;
    },

    destroy() {
      storage = {};
    },
  };
}

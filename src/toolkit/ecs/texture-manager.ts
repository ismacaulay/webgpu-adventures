import type { TextureManager } from 'toolkit/types/ecs/managers';
import type { Texture, TextureDescriptor } from 'toolkit/types/webgpu/textures';
import { createTextureFromBuffer, createTextureFromURI } from 'toolkit/webgpu/texture';

export function createTextureManager(device: GPUDevice): TextureManager {
  const storage: any = {};
  let next = 0;

  return {
    createSampler(descriptor: GPUSamplerDescriptor) {
      const sampler = device.createSampler(descriptor);
      storage[next] = sampler;
      return next++;
    },

    async createTexture(descriptor: TextureDescriptor) {
      const { resource, format } = descriptor;

      let texture: Texture;
      if ('uri' in resource) {
        texture = await createTextureFromURI(device, resource.uri, format);
      } else {
        texture = await createTextureFromBuffer(device, resource.buffer, resource.shape, format);
      }

      storage[next] = texture;
      return next++;
    },

    get<T extends GPUSampler | Texture>(id: number): T {
      const obj = storage[id];
      if (!obj) {
        throw new Error(`Unknown id: ${id}`);
      }
      return obj as T;
    },

    destroy() {
      Object.values(storage).forEach((obj) => {
        if (obj instanceof GPUTexture) {
          obj.destroy();
        }
      });
    },
  };
}

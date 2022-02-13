import { createTextureFromImage } from 'utils/img-loader';

interface SamplerStorage {
  [key: number]: GPUSampler;
}

interface TextureStorage {
  [key: number]: GPUTexture;
}

export interface TextureDescriptor {
  uri: string;
  usage: number;
}

export interface TextureManager {
  createSampler(descriptor: GPUSamplerDescriptor): number;
  getSampler(id: number): GPUSampler;

  createTexture(descriptor: TextureDescriptor): Promise<number>;
  getTexture(id: number): GPUTexture;

  destroy(): void;
}

export function createTextureManager(device: GPUDevice): TextureManager {
  let samplerStorage: SamplerStorage = {};
  let textureStorage: TextureStorage = {};

  let nextSampler = 0;
  let nextTexture = 0;

  return {
    createSampler(descriptor: GPUSamplerDescriptor) {
      const id = nextSampler;
      nextSampler++;

      samplerStorage[id] = device.createSampler(descriptor);

      return id;
    },
    getSampler(id: number) {
      return samplerStorage[id];
    },

    async createTexture({ uri, usage }: TextureDescriptor) {
      const id = nextTexture;
      nextTexture++;

      textureStorage[id] = await createTextureFromImage(device, uri, usage);

      return id;
    },
    getTexture(id: number) {
      return textureStorage[id];
    },

    destroy() {
      Object.values(textureStorage).forEach((t) => {
        t.destroy();
      });

      textureStorage = {};
      samplerStorage = {};
    },
  };
}

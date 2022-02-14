import type { Texture } from 'toolkit/types/webgpu/textures';
import { createNeedsUpdate } from 'toolkit/utils';

export async function createTextureFromURI(
  device: GPUDevice,
  uri: string,
  format: GPUTextureFormat,
): Promise<Texture> {
  const img = document.createElement('img');
  img.src = uri;
  await img.decode();
  const imageBitmap = await createImageBitmap(img);

  const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format,
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  return {
    texture,
    data: imageBitmap,

    ...createNeedsUpdate(),
  };
}

export async function createTextureFromBuffer(
  device: GPUDevice,
  buffer: Uint8Array | Uint8ClampedArray,
  shape: [number, number, number],
  format: GPUTextureFormat,
): Promise<Texture> {
  const texture = device.createTexture({
    size: [shape[0], shape[1], 1],
    format,
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  return {
    texture,
    data: { buffer, shape },

    ...createNeedsUpdate(),
  };
}

export interface Sampler {
  sampler: GPUSampler;
}

export interface URITextureResource {
  uri: string;
}

export interface BufferTextureResource {
  buffer: Uint8Array | Uint8ClampedArray;
  shape: [number, number, number];
}

export interface TextureDescriptor {
  resource: URITextureResource | BufferTextureResource;
  format: GPUTextureFormat;
}

export interface Texture {
  needsUpdate: boolean;
  texture: GPUTexture;
  data: ImageBitmap | { buffer: ArrayBuffer; shape: [number, number, number] };
}

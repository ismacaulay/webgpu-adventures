import { UniformBuffer, UniformDictionary } from '../buffers';

export enum ShaderBindingType {
  UniformBuffer = 'uniform-buffer',
  Sampler = 'sampler',
  SampledTexture = 'sampled-texture',
}

interface BaseBinding {
  binding: number;
  visibility: number;
  type: ShaderBindingType;
}

export interface UniformBufferBinding extends BaseBinding {
  type: ShaderBindingType.UniformBuffer;
  resource: UniformBuffer;
}

export interface SamplerBinding extends BaseBinding {
  type: ShaderBindingType.Sampler;
  resource: GPUSampler;
}

export interface SampledTextureBinding extends BaseBinding {
  type: ShaderBindingType.SampledTexture;
  resource: GPUTextureView;
}

export type ShaderBinding = UniformBufferBinding | SamplerBinding | SampledTextureBinding;

export interface Shader {
  id: number;
  stages: any;

  bindGroupLayout: GPUBindGroupLayout;
  bindGroup: GPUBindGroup;

  buffers: UniformBuffer[];

  update(uniforms: UniformDictionary): void;

  depthWrite: boolean;
  depthFunc: GPUCompareFunction;

  stencilFront: GPUStencilStateFaceDescriptor;
  stencilBack: GPUStencilStateFaceDescriptor;
  stencilWriteMask: number;
  stencilReadMask: number;
  stencilValue: number;
}

interface ShaderBindingDescriptor {
  type: ShaderBindingType;
  resource: number;
}

interface BaseShaderDescriptor {
  bindings: ShaderBindingDescriptor[];
}

export interface SingleSourceShaderDescriptor extends BaseShaderDescriptor {
  source: string;
  vertex: {
    entryPoint: string;
  };
  fragment: {
    entryPoint: string;
  };
}

export interface MultiSourceShaderDescriptor extends BaseShaderDescriptor {
  vertex: {
    source: string;
    entryPoint: string;
  };
  fragment: {
    source: string;
    entryPoint: string;
  };
}

export type ShaderDescriptor = SingleSourceShaderDescriptor | MultiSourceShaderDescriptor;

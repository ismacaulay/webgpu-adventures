import type { UniformBuffer, UniformDictionary } from './buffers';
import type { Texture } from './textures';

/*
 * WebGPU
 */
interface BufferBindGroupEntry {
  resource: {
    buffer: GPUBuffer;
  };
}

interface SamplerBindGroupEntry {
  resource: GPUSampler;
}

interface TextureBindGroupEntry {
  resource: GPUTextureView;
}

type ShaderBindGroupEntry = BufferBindGroupEntry | SamplerBindGroupEntry | TextureBindGroupEntry;

export interface ShaderBindGroupDescriptor {
  entries: ShaderBindGroupEntry[];
}

export enum ShaderType {
  Render,
  PostProcessing,
}

interface BaseShader {
  id: number;
  needsUpdate: boolean;
  type: ShaderType;
}

export interface Shader extends BaseShader {
  type: ShaderType.Render;
  vertex: { module: GPUShaderModule; entryPoint: string };
  fragment: { module: GPUShaderModule; entryPoint: string };
  bindings: ShaderBindGroupDescriptor[];
  buffers: UniformBuffer[];
  textures: Texture[];

  update(uniforms: UniformDictionary): void;

  depthWrite: boolean;
  depthFunc: GPUCompareFunction;

  stencilFront: GPUStencilFaceState;
  stencilBack: GPUStencilFaceState;
  stencilWriteMask: number;
  stencilReadMask: number;
  stencilValue: number;

  blend: GPUBlendState;
}

export interface PostProcessingShader extends BaseShader {
  type: ShaderType.PostProcessing;
  fragment: { module: GPUShaderModule; entryPoint: string };
}

/*
 * Descriptor
 */
export enum ShaderBindingType {
  UniformBuffer,
  // StorageBuffer,
  Texture,
  Sampler,
}

export interface ShaderBindingDescriptor {
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

export interface PostProcessingShaderDescriptor {
  source: string;
  entryPoint: string;
}

export type ShaderDescriptor =
  | SingleSourceShaderDescriptor
  | MultiSourceShaderDescriptor
  | PostProcessingShaderDescriptor;

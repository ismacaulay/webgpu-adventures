import type { vec3 } from 'gl-matrix';
import type {
  Buffer,
  IndexBufferDescriptor,
  UniformBufferDescriptor,
  UniformDictionary,
  VertexBufferDescriptor,
} from '../webgpu/buffers';
import type { Shader, ShaderDescriptor } from '../webgpu/shaders';
import type { Texture, TextureDescriptor } from '../webgpu/textures';
import type { Component, ComponentType } from './components';

/**
 * entity manager
 */
export type Entity = number;

export type ComponentFlags = number;
export type ComponentMap = Map<ComponentType, Component>;
export type ComponentList = Component[];

export interface EntityManager {
  create(): Entity;

  addComponent(entity: Entity, component: Component): void;
  get(id: number, components: ComponentType[]): ComponentList;
  all(components: ComponentType[]): ComponentList[];
  view(components: ComponentType[]): Iterator<ComponentList>;

  destroy(): void;
}

/**
 * buffer manager
 */
export type BufferId = number;

export enum DefaultBuffers {
  ViewProjection = 0,

  Count,
}

export interface BufferStorage {
  [key: BufferId]: Buffer;
}

export interface BufferManager {
  createVertexBuffer(descriptor: VertexBufferDescriptor): BufferId;
  createUniformBuffer(descriptor: UniformBufferDescriptor, initial?: UniformDictionary): BufferId;
  createIndexBuffer(descriptor: IndexBufferDescriptor): BufferId;

  get<T extends Buffer>(id: BufferId): T;

  destroy(): void;
}

/**
 * shader manager
 */
export interface ShaderManager {
  get(id: number): Shader;
  create(descriptor: ShaderDescriptor): number;
  destroy(): void;
}

/**
 * texture manager
 */
export interface TextureManager {
  createSampler(descriptor: GPUSamplerDescriptor): number;
  createTexture(descriptor: TextureDescriptor): Promise<number>;
  get<T extends GPUSampler | Texture>(id: number): T;

  destroy(): void;
}

/**
 * light manager
 */
export enum LightType {
  Directional,
  Point,
  Spot,
}

interface BaseLight {
  type: LightType;

  ambient: vec3;
  diffuse: vec3;
  specular: vec3;
}

export interface DirectionalLight extends BaseLight {
  type: LightType.Directional;

  direction: vec3;
}

export interface PointLight extends BaseLight {
  type: LightType.Point;

  position: vec3;
  kc: number;
  kl: number;
  kq: number;
}

export interface SpotLight extends BaseLight {
  type: LightType.Spot;

  position: vec3;
  direction: vec3;
  inner_cutoff: number;
  outer_cutoff: number;
  kc: number;
  kl: number;
  kq: number;
}

export type Light = DirectionalLight | PointLight | SpotLight;

interface LightStorage {
  [LightType.Directional]: DirectionalLight[];
  [LightType.Point]: PointLight[];
  [LightType.Spot]: SpotLight[];
}

export interface LightManager {
  create(light: Light): number;
  // TODO: Can we type this in a way that it figures out what array type is returned?
  all(type: LightType): Light[];
  get<T extends Light>(id: number): T;

  destroy(): void;
}

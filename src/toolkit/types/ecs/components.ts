import type { mat4, vec3 } from 'gl-matrix';
import type { BoundingBox } from 'toolkit/types/math';
import type {
  IndexBufferDescriptor,
  UniformDictionary,
  VertexBufferDescriptor,
} from '../webgpu/buffers';

export enum ComponentType {
  Transform = 1,
  Geometry = 2,
  Material = 4,
  Script = 8,
}

export interface BaseComponent {
  type: ComponentType;
}

export interface TransformComponent extends BaseComponent {
  type: ComponentType.Transform;
  needsUpdate: boolean;

  translation: vec3;
  // TODO: this should be a quat
  rotation: {
    angle: number;
    axis: vec3;
  };
  scale: vec3;

  readonly matrix: mat4;
}

export interface BaseGeometryComponent extends BaseComponent {
  type: ComponentType.Geometry;
  needsUpdate: boolean;
}

export interface MeshGeometryComponent extends BaseGeometryComponent {
  indices?: IndexBufferDescriptor;
  buffers: VertexBufferDescriptor[];
  count: number;
}
export type GeometryComponent = MeshGeometryComponent;

export type ShaderId = number;

export interface ShaderMaterialComponent extends BaseComponent {
  type: ComponentType.Material;
  needsUpdate: boolean;

  shader: ShaderId;
  uniforms?: UniformDictionary;
}
export type MaterialComponent = ShaderMaterialComponent;

export interface ScriptComponent extends BaseComponent {
  type: ComponentType.Script;

  update: (dt?: number) => void;
}

export type Component =
  | TransformComponent
  | GeometryComponent
  | MaterialComponent
  | ScriptComponent;

export type ComponentList = Component[];

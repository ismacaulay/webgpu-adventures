import type { mat4, vec3 } from 'gl-matrix';
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
  Movement = 16,
}

export interface BaseComponent {
  type: ComponentType;
}

/**
 * Transform
 */
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

/**
 * Geometry
 */
export interface BaseGeometryComponent extends BaseComponent {
  type: ComponentType.Geometry;
  needsUpdate: boolean;
}

export interface MeshGeometryComponent extends BaseGeometryComponent {
  indices?: IndexBufferDescriptor;
  buffers: VertexBufferDescriptor[];
  count: number;
  instances: number;
}
export type GeometryComponent = MeshGeometryComponent;

/**
 * Shader
 */
export type ShaderId = number;

export interface BasicMaterialComponent extends BaseComponent {
  type: ComponentType.Material;

  needsUpdate: boolean;
  shader: ShaderId;
  drawOrder: number;
  uniforms: UniformDictionary;
}

export interface ShaderMaterialComponent extends BaseComponent {
  type: ComponentType.Material;
  needsUpdate: boolean;

  shader: ShaderId;
  drawOrder: number;
  uniforms?: UniformDictionary;
}
export type MaterialComponent = ShaderMaterialComponent | BasicMaterialComponent;

/**
 * Script
 */
export interface ScriptComponent extends BaseComponent {
  type: ComponentType.Script;

  update: (dt?: number) => void;
}

/**
 * Movement
 */
export enum MovementType {
  Circular,
}

export interface CircularMovementComponent {
  type: ComponentType.Movement;
  subtype: MovementType.Circular;

  center: vec3;
  axis: vec3;
  radius: number;
  period: number;
}
export type MovementComponent = CircularMovementComponent;

export type Component =
  | TransformComponent
  | GeometryComponent
  | MaterialComponent
  | ScriptComponent
  | MovementComponent;

export type ComponentList = Component[];

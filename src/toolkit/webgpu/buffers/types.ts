import { mat2, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix';

export enum BufferType {
  Vertex,
  Uniform,
}

export interface Buffer {
  type: BufferType;

  readonly buffer: GPUBuffer;
  readonly data: Float32Array;

  destroy(): void;
}

export enum BufferAttributeType {
  Float2 = 'float2',
  Float3 = 'float3',
}

export interface BufferAttribute {
  type: BufferAttributeType;
  location: number;
}

export interface VertexBuffer extends Buffer {
  type: BufferType.Vertex;

  readonly descriptor: GPUVertexBufferLayoutDescriptor;
  readonly count: number;
}

export type UniformValue =
  | boolean
  | number
  | ArrayLike<number>
  | ArrayLike<number>[]
  | UniformDictionary
  | UniformDictionary[];

export interface UniformDictionary {
  [key: string]: UniformValue;
}

export interface UniformLocationDictionary {
  [key: string]: number | boolean | { offset: number; c: number; r: number };
}

export interface UniformBuffer extends Buffer {
  type: BufferType.Uniform;

  needsUpdate: boolean;
  hasUniform(name: string): boolean;
  updateUniform(name: string, value: UniformValue): void;
  updateUniforms(uniforms: UniformDictionary): void;
  destroy(): void;
}

export enum UniformType {
  Scalar,
  Vec2,
  Vec3,
  Vec4,
  Mat2,
  Mat2x3,
  Mat2x4,
  Mat3x2,
  Mat3,
  Mat3x4,
  Mat4x2,
  Mat4x3,
  Mat4,
}

export interface UniformBufferDescriptor {
  [key: string]:
    | UniformType
    | UniformBufferDescriptor
    | [UniformType, number]
    | [UniformBufferDescriptor, number];
}

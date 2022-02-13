export enum BufferType {
  Vertex,
  Uniform,
  Index,
}

export interface BaseBuffer {
  type: BufferType;

  readonly buffer: GPUBuffer;

  destroy(): void;
}

export enum BufferAttributeFormat {
  Float32 = 'float32',
  Float32x2 = 'float32x2',
  Float32x3 = 'float32x3',
}

export interface BufferAttribute {
  format: BufferAttributeFormat;
  location: number;
}

export interface VertexBufferDescriptor {
  id?: number;
  array: Float32Array;
  attributes: BufferAttribute[];
}

export interface VertexBuffer extends BaseBuffer {
  type: BufferType.Vertex;

  readonly data: Float32Array;
  readonly layout: GPUVertexBufferLayout;
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

export interface UniformBuffer extends BaseBuffer {
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

export interface IndexBufferDescriptor {
  id?: number;
  array: Uint16Array | Uint32Array;
}

export interface IndexBuffer extends BaseBuffer {
  type: BufferType.Index;

  readonly data: Uint16Array | Uint32Array;

  format: GPUIndexFormat;
}

export type Buffer = VertexBuffer | UniformBuffer | IndexBuffer;

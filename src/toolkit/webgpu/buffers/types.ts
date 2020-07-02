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
    | number[]
    | Float32Array
    | UniformDictionary;

export interface UniformDictionary {
    [key: string]: UniformValue;
}

export interface UniformLocationDictionary {
    [key: string]: number | boolean;
}

export interface UniformBuffer extends Buffer {
    type: BufferType.Uniform;

    needsUpdate: boolean;
    hasUniform(name: string): boolean;
    updateUniform(name: string, value: UniformValue): void;
    updateBuffer(encoder?: GPUCommandEncoder): void;
    destroy(): void;
}

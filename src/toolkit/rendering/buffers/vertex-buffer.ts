import { createBuffer } from 'rendering/utils';

export enum BufferAttributeType {
    Float3 = 'float3',
}

export interface BufferAttribute {
    type: BufferAttributeType;
}

export interface VertexBuffer {
    readonly descriptor: GPUVertexBufferLayoutDescriptor;
    readonly buffer: GPUBuffer;
    readonly count: number;

    destroy(): void;
}

function getSizeForType(type: BufferAttributeType) {
    switch (type) {
        case BufferAttributeType.Float3:
            return 4 * 3;
        default:
            throw new Error(`Unknown BufferAttributeType ${type}`);
    }
}

function buildGPUVertexAttributes(attributes: BufferAttribute[]) {
    const gpuAttrs: GPUVertexAttributeDescriptor[] = [];
    let stride = 0;

    for (let i = 0; i < attributes.length; ++i) {
        const { type } = attributes[i];

        gpuAttrs.push({
            shaderLocation: i,
            format: type,
            offset: stride,
        });

        stride += getSizeForType(type);
    }

    return { attributes: gpuAttrs, stride };
}

export function createVertexBuffer(
    device: GPUDevice,
    attributes: BufferAttribute[],
    data: Float32Array,
): VertexBuffer {
    const { attributes: gpuAttributes, stride } = buildGPUVertexAttributes(
        attributes,
    );

    const descriptor: GPUVertexBufferLayoutDescriptor = {
        attributes: gpuAttributes,
        arrayStride: stride,
        stepMode: 'vertex',
    };

    const buffer = createBuffer(device, data, GPUBufferUsage.VERTEX);

    const count = (data.BYTES_PER_ELEMENT * data.length) / stride;
    
    return {
        descriptor,
        buffer,
        count,

        destroy() {
            buffer.destroy();
        }
    };
}

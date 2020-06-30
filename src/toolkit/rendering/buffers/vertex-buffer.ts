import { createBuffer } from 'rendering/utils';
import {
    BufferAttributeType,
    BufferAttribute,
    VertexBuffer,
    BufferType,
} from './types';

function getSizeForType(type: BufferAttributeType) {
    switch (type) {
        case BufferAttributeType.Float3:
            return 4 * 3;
        default:
            throw new Error(`Unknown BufferAttributeType ${type}`);
    }
}

export function getCountForType(type: BufferAttributeType) {
    switch (type) {
        case BufferAttributeType.Float3:
            return 3;
        default:
            throw new Error(`Unknown BufferAttributeType ${type}`);
    }
}

function buildGPUVertexAttributes(attributes: BufferAttribute[]) {
    const gpuAttrs: GPUVertexAttributeDescriptor[] = [];
    let stride = 0;

    for (let i = 0; i < attributes.length; ++i) {
        const { type, location } = attributes[i];

        gpuAttrs.push({
            shaderLocation: location,
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
        type: BufferType.Vertex,
        buffer,
        data,
        descriptor,
        count,

        destroy() {
            buffer.destroy();
        },
    };
}

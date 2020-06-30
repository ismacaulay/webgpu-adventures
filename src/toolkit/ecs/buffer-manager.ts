import {
    BufferAttribute,
    createVertexBuffer as createWebGPUVertexBuffer,
    Buffer,
    createUniformBuffer,
} from 'toolkit/rendering/buffers';
import { mat4 } from 'gl-matrix';

export interface VertexBufferInfo {
    id?: number;
    attributes: BufferAttribute[];
    array: Float32Array;
}

export interface BufferManager {
    createVertexBuffer(info: VertexBufferInfo): number;

    get<T extends Buffer>(id: number): T;
}

export enum DefaultBuffers {
    ViewProjection = 0,

    Count,
}

interface BufferStorage {
    [key: number]: Buffer;
}

export function createBufferManager(device: GPUDevice): BufferManager {
    const storage: BufferStorage = {};
    let next = DefaultBuffers.Count;

    return {
        createVertexBuffer(info: VertexBufferInfo) {
            const id = next;
            next++;

            storage[id] = createWebGPUVertexBuffer(
                device,
                info.attributes,
                info.array,
            );
            return id;
        },

        get<T extends Buffer>(id: number): T {
            let buffer = storage[id];

            if (!buffer) {
                if (id === DefaultBuffers.ViewProjection) {
                    buffer = createUniformBuffer(device, {
                        view: mat4.create(),
                        projection: mat4.create(),
                    });
                    storage[id] = buffer;
                } else {
                    throw new Error(`Unknown buffer: ${id}`);
                }
            }

            return buffer as T;
        },
    };
}

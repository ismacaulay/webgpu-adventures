import { createBuffer } from 'rendering/utils';
import {
    UniformValue,
    UniformDictionary,
    UniformLocationDictionary,
    UniformBuffer,
    BufferType,
} from './types';

export function processUniforms(uniforms: UniformDictionary) {
    let buffer: number[] = [];
    let location = 0;
    const locations: UniformLocationDictionary = {};

    function processUniformsRecursive(
        uniforms: UniformDictionary,
        keyBase = '',
    ) {
        const entries = Object.entries(uniforms);

        for (let i = 0; i < entries.length; ++i) {
            const [key, value] = entries[i];

            let locationKey = key;
            if (keyBase) {
                locationKey = `${keyBase}.${key}`;
            }

            if (typeof value === 'number') {
                locations[locationKey] = location;
                buffer.push(value);
                location += 1;
            } else if (typeof value === 'boolean') {
                locations[locationKey] = location;
                buffer.push(+value);
                location += 1;
            } else if (Array.isArray(value) || value instanceof Float32Array) {
                switch (value.length) {
                    case 2:
                        if (location % 2 !== 0) {
                            buffer.push(0);
                            location += 1;
                        }

                        locations[locationKey] = location;
                        buffer.push(...value);
                        location += 2;
                        break;
                    case 3:
                        if (location % 4 !== 0) {
                            const padding = 4 - (location % 4);
                            buffer.push(...Array(padding).fill(0));
                            location += padding;
                        }
                        locations[locationKey] = location;
                        buffer.push(...value);
                        location += 3;
                        break;
                    case 4:
                        if (location % 4 !== 0) {
                            const padding = 4 - (location % 4);
                            buffer.push(...Array(padding).fill(0));
                            location += padding;
                        }
                        locations[locationKey] = location;
                        buffer.push(...value);
                        location += 4;
                        break;
                    case 16:
                        // TODO: Base align this properly
                        locations[locationKey] = location;
                        buffer.push(...value);
                        location += 16;
                        break;
                    default:
                        throw new Error(
                            `Unable to handle arrays of length: ${value.length}`,
                        );
                }
            } else if (typeof value === 'object') {
                if (location % 4 !== 0) {
                    const padding = 4 - (location % 4);
                    buffer.push(...Array(padding).fill(0));
                    location += padding;
                }

                locations[locationKey] = true;
                processUniformsRecursive(value, locationKey);

                if (location % 4 !== 0) {
                    const padding = 4 - (location % 4);
                    buffer.push(...Array(padding).fill(0));
                    location += padding;
                }
            }
        }
    }

    processUniformsRecursive(uniforms);

    return { buffer: Float32Array.from(buffer), locations };
}

export function createUniformBuffer(
    device: GPUDevice,
    uniforms: UniformDictionary,
): UniformBuffer {
    const { buffer, locations } = processUniforms(uniforms);

    const gpuBuffer = createBuffer(
        device,
        buffer,
        GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    );

    let needsUpdate = false;

    function updateUniform(name: string, value: UniformValue) {
        const location = locations[name];
        if (location === undefined) {
            throw new Error(`Unknown uniform: ${name}`);
        }

        if (typeof location === 'boolean') {
            if (!(typeof value === 'object')) {
                throw new Error(
                    `Invalid value given for ${name}. Requires an object`,
                );
            }

            Object.entries(value).forEach(([key, value]) => {
                updateUniform(`${name}.${key}`, value);
            });

            return;
        } else {
            if (typeof value === 'number') {
                buffer.set([value], location);
            } else if (Array.isArray(value) || value instanceof Float32Array) {
                buffer.set(value, location);
            }
        }

        needsUpdate = true;
    }

    return {
        type: BufferType.Uniform,
        buffer: gpuBuffer,
        data: buffer,

        get needsUpdate() {
            return needsUpdate;
        },
        set needsUpdate(value: boolean) {
            needsUpdate = value;
        },

        hasUniform(name: string): boolean {
            return name in locations;
        },
        updateUniform,

        updateBuffer(encoder?: GPUCommandEncoder) {
            if (!needsUpdate) {
                return;
            }

            const uploadBuffer = createBuffer(
                device,
                buffer,
                GPUBufferUsage.COPY_SRC,
            );

            // TODO: How efficient is it to create a command encoder and submit it for each buffer update?
            const enc = encoder || device.createCommandEncoder();
            // TODO: we should do better than updating the whole buffer as maybe only a few bytes changed
            enc.copyBufferToBuffer(
                uploadBuffer,
                0,
                gpuBuffer,
                0,
                buffer.byteLength,
            );

            if (!encoder) {
                device.defaultQueue.submit([enc.finish()]);
            }

            uploadBuffer.destroy();

            needsUpdate = false;
        },

        destroy() {
            gpuBuffer.destroy();
        },
    };
}

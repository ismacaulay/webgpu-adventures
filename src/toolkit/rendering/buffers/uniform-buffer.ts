import { createBuffer } from 'rendering/utils';

type UniformValue = boolean | number | number[] | Float32Array;

interface UniformDictionary {
    [key: string]: UniformValue;
}

interface UniformLocation {
    offset: number;
}

interface UniformLocationDictionary {
    [key: string]: UniformLocation;
}

function processUniforms(uniforms: UniformDictionary) {
    const entries = Object.entries(uniforms);

    const buffer: number[] = [];
    let offset = 0;
    const locations: UniformLocationDictionary = {};

    for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i];
        locations[key] = { offset };

        if (typeof value === 'number') {
            buffer.push(value);
            offset += 1;
        } else if (Array.isArray(value) || value instanceof Float32Array) {
            buffer.push(...value);
            switch (value.length) {
                case 2:
                    offset += 2;
                    break;
                case 3:
                    buffer.push(0);
                case 4:
                    offset += 4;
                    break;
                case 16:
                    offset += 16;
                    break;
                default:
                    throw new Error(
                        `Unknown uniform array length: ${value.length} for value: ${value}`,
                    );
            }
        }
    }

    return { buffer: Float32Array.from(buffer), locations };
}

export function createUniformBuffer(
    device: GPUDevice,
    uniforms: UniformDictionary,
) {
    const { buffer, locations } = processUniforms(uniforms);

    const gpuBuffer = createBuffer(
        device,
        buffer,
        GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    );

    return {
        buffer: gpuBuffer,

        updateUniform(name: string, value: UniformValue) {
            const location = locations[name];
            if (!location) {
                throw new Error(`Unknown uniform: ${name}`);
            }

            const { offset } = location;
            if (typeof value === 'number') {
                buffer.set([value], offset);
            } else if (Array.isArray(value) || value instanceof Float32Array) {
                buffer.set(value, offset);
            }
        },

        updateBuffer() {
            const uploadBuffer = createBuffer(
                device,
                buffer,
                GPUBufferUsage.COPY_SRC,
            );

            // TODO: How efficient is it to create a command encoder and submit it for each buffer update?
            const encoder = device.createCommandEncoder();
            // TODO: we should do better than updating the whole buffer as maybe only a few bytes changed
            encoder.copyBufferToBuffer(
                uploadBuffer,
                0,
                gpuBuffer,
                0,
                buffer.byteLength,
            );
            device.defaultQueue.submit([encoder.finish()]);

            uploadBuffer.destroy();
        },

        destroy() {
            gpuBuffer.destroy();
        },
    };
}

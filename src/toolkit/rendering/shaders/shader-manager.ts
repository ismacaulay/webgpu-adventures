import glslangModule from './glslang';
import { createShader } from './shader';
import { createBasicShader } from './basic-shader';
import { BufferManager, DefaultBuffers } from 'toolkit/ecs/buffer-manager';
import { UniformBuffer } from '../buffers';

export interface ShaderManager {
    get(id: number): any;
}

export enum DefaultShaders {
    Basic = 0,

    Count,
}

export async function createShaderManager(
    device: GPUDevice,
    bufferManager: BufferManager,
) {
    const glslang = await glslangModule();

    const storage: any = {};

    let next = DefaultShaders.Count;

    return {
        get(id: number) {
            let shader = storage[id];
            if (!shader) {
                if (id < DefaultShaders.Count) {
                    if (id === DefaultShaders.Basic) {
                        const viewProjectionUBO = bufferManager.get<
                            UniformBuffer
                        >(DefaultBuffers.ViewProjection);
                        shader = createBasicShader(
                            device,
                            glslang,
                            viewProjectionUBO,
                        );
                    }
                    storage[id] = shader;
                } else {
                    throw new Error(`Unknown shader: ${id}`);
                }
            }

            return shader;
        },

        create(vertex: string, fragment: string, bindings: any[]) {
            const id = next;
            next++;

            const shader = createShader(device, glslang, {
                vertex,
                fragment,
                bindings,
            });
            storage[id] = shader;
            return id;
        },
    };
}

import glslangModule from 'toolkit/webgpu/shaders/glslang';
import { createShader } from 'toolkit/webgpu/shaders';
import { Buffer } from 'toolkit/webgpu/buffers';

export interface ShaderBinding {
    binding: number;
    visibility: number;
    type: string;
    resource: Buffer | GPUSampler | GPUTextureView;
}
export interface ShaderInfo {
    vertex: string;
    fragment: string;
    bindings: ShaderBinding[];
}

export interface ShaderManager {
    get(id: number): any;
    create(info: ShaderInfo): number;
}

export async function createShaderManager(device: GPUDevice) {
    const glslang = await glslangModule();

    const storage: any = {};

    let next = 0;

    return {
        get(id: number) {
            let shader = storage[id];
            if (!shader) {
                throw new Error(`Unknown shader: ${id}`);
            }

            return shader;
        },

        create({ vertex, fragment, bindings }: ShaderInfo) {
            const id = next;
            next++;

            const shader = createShader(device, glslang, {
                id,
                vertex,
                fragment,
                bindings,
            });
            storage[id] = shader;
            return id;
        },
    };
}

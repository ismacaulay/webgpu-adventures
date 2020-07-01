import glslangModule from './glslang';
import { createShader } from './shader';

export interface ShaderInfo {
    vertex: string;
    fragment: string;
    bindings: any[];
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

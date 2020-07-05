import glslangModule from 'toolkit/webgpu/shaders/glslang';
import {
    ShaderBinding,
    createShader,
    cloneShader,
    Shader,
} from 'toolkit/webgpu/shaders';

export interface ShaderDescriptor {
    vertex: string;
    fragment: string;
    bindings: ShaderBinding[];
}

export interface ShaderManager {
    get(id: number): Shader;
    create(descriptor: ShaderDescriptor): number;
}

export async function createShaderManager(device: GPUDevice) {
    const glslang = await glslangModule();

    const storage: any = {};

    let storageId = 0;
    let shaderId = 0;

    return {
        get(id: number) {
            let shader = storage[id];
            if (!shader) {
                throw new Error(`Unknown shader: ${id}`);
            }

            return shader;
        },

        create({ vertex, fragment, bindings }: ShaderDescriptor) {
            const shader = createShader(device, glslang, {
                id: shaderId,
                vertex,
                fragment,
                bindings,
            });
            shaderId++;

            const id = storageId;
            storageId++;
            storage[id] = shader;
            return id;
        },

        clone(id: number, bindings: ShaderBinding[]) {
            const shader = storage[id];
            if (!shader) {
                throw new Error(`Unknown shader: ${id}`);
            }

            const next = storageId;
            storageId++;
            storage[next] = cloneShader(device, shader, bindings);
            return next;
        },
    };
}

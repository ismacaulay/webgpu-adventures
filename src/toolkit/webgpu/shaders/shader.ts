import { UniformBuffer, UniformDictionary } from '../buffers';
import { ShaderBinding, Shader, ShaderBindingType } from './types';

function processBindings(bindings: ShaderBinding[]) {
    const entries: GPUBindGroupEntry[] = [];
    const buffers: UniformBuffer[] = [];

    for (let i = 0; i < bindings.length; ++i) {
        const binding = bindings[i];
        if (binding.type === ShaderBindingType.UniformBuffer) {
            buffers.push(binding.resource);
            entries.push({
                binding: binding.binding,
                resource: {
                    buffer: binding.resource.buffer,
                },
            });
        } else {
            entries.push({
                binding: binding.binding,
                resource: binding.resource,
            });
        }
    }

    return {
        buffers,
        entries,
    };
}
function updateBuffers(buffers: UniformBuffer[], uniforms: UniformDictionary) {
    Object.entries(uniforms).forEach(([name, value]) => {
        let found = false;
        for (let i = 0; i < buffers.length; ++i) {
            const buffer = buffers[i];
            if (buffer.hasUniform(name)) {
                buffer.updateUniform(name, value);

                found = true;
                break;
            }
        }

        if (!found) {
            console.warn(`[shader] Tried to update unknown uniform: ${name}`);
        }
    });
}

export function createShader(
    device: GPUDevice,
    glslang: any,
    {
        id,
        vertex,
        fragment,
        bindings,
    }: { id: number; vertex: string; fragment: string; bindings: any[] },
): Shader {
    const { buffers, entries } = processBindings(bindings);
    const bindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
        entries: bindings.map(binding => ({
            binding: binding.binding,
            visibility: binding.visibility,
            type: binding.type,
        })),
    });

    return {
        id,
        stages: {
            vertexStage: {
                module: device.createShaderModule({
                    code: glslang.compileGLSL(vertex, 'vertex'),
                }),
                entryPoint: 'main',
            },
            fragmentStage: {
                module: device.createShaderModule({
                    code: glslang.compileGLSL(fragment, 'fragment'),
                }),
                entryPoint: 'main',
            },
        },

        bindGroupLayout,
        bindGroup: device.createBindGroup({ layout: bindGroupLayout, entries }),
        buffers,

        update: (uniforms: UniformDictionary) =>
            updateBuffers(buffers, uniforms),
    };
}

export function cloneShader(
    device: GPUDevice,
    shader: any,
    bindings: ShaderBinding[],
): Shader {
    const { id, bindGroupLayout, stages } = shader;
    const { buffers, entries } = processBindings(bindings);

    return {
        id,
        stages,
        bindGroupLayout,
        bindGroup: device.createBindGroup({ layout: bindGroupLayout, entries }),
        buffers,

        update: (uniforms: UniformDictionary) =>
            updateBuffers(buffers, uniforms),
    };
}

import { UniformBuffer, UniformDictionary } from '../buffers';

export function createShader(
    device: GPUDevice,
    glslang: any,
    {
        id,
        vertex,
        fragment,
        bindings,
    }: { id: number; vertex: string; fragment: string; bindings: any[] },
) {
    const vertexModule: GPUShaderModule = device.createShaderModule({
        code: glslang.compileGLSL(vertex, 'vertex'),
    });

    const fragmentModule: GPUShaderModule = device.createShaderModule({
        code: glslang.compileGLSL(fragment, 'fragment'),
    });

    const layoutEntries = [];
    const groupEntries = [];
    const uniformBuffers: UniformBuffer[] = [];
    for (let i = 0; i < bindings.length; ++i) {
        const binding = bindings[i];
        layoutEntries.push({
            binding: binding.binding,
            visibility: binding.visibility,
            type: binding.type,
        });

        if (binding.type === 'uniform-buffer') {
            groupEntries.push({
                binding: binding.binding,
                resource: {
                    buffer: binding.resource.buffer,
                },
            });
            uniformBuffers.push(binding.resource);
        } else {
            groupEntries.push({
                binding: binding.binding,
                resource: binding.resource,
            });
        }
    }

    const bindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
        entries: layoutEntries,
    });
    const bindGroup: GPUBindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: groupEntries,
    });

    return {
        id,
        bindGroupLayout,
        bindGroup,
        buffers: uniformBuffers,

        stages: {
            vertexStage: {
                module: vertexModule,
                entryPoint: 'main',
            },
            fragmentStage: {
                module: fragmentModule,
                entryPoint: 'main',
            },
        },

        update(uniforms: UniformDictionary) {
            Object.entries(uniforms).forEach(([name, value]) => {
                let found = false;
                for (let i = 0; i < uniformBuffers.length; ++i) {
                    const buffer = uniformBuffers[i];
                    if (buffer.hasUniform(name)) {
                        buffer.updateUniform(name, value);

                        found = true;
                        break;
                    }
                }

                if (!found) {
                    console.warn(
                        `[shader] Tried to update unknown uniform: ${name}`,
                    );
                }
            });
        },
    };
}

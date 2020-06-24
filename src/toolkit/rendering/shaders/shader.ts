import glslangModule from './glslang';

export async function createShader(
    device: GPUDevice,
    { vertex, fragment, bindings }: { vertex: string; fragment: string, bindings?: any[] },
) {
    const glslang = await glslangModule();

    const vertexModule: GPUShaderModule = device.createShaderModule({
        code: glslang.compileGLSL(vertex, 'vertex'),
    });

    const fragmentModule: GPUShaderModule = device.createShaderModule({
        code: glslang.compileGLSL(fragment, 'fragment'),
    });

    const bindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
        entries: bindings ? bindings.map((binding: any) => ({
            binding: binding.binding,
            visibility: binding.visibility,
            type: binding.type,
        })) : [],
    });
    const bindGroup: GPUBindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: bindings ? bindings.map((binding: any) => ({
            binding: binding.binding,
            resource: binding.resource,
        })) : []
    });

    return {
        bindGroupLayout,
        bindGroup,
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
    };
}

import glslangModule from './glslang';

export async function createShader(
    device: GPUDevice,
    { vertex, fragment }: { vertex: string; fragment: string },
) {
    const glslang = await glslangModule();

    const vertexModule: GPUShaderModule = device.createShaderModule({
        code: glslang.compileGLSL(vertex, 'vertex'),
    });

    const fragmentModule: GPUShaderModule = device.createShaderModule({
        code: glslang.compileGLSL(fragment, 'fragment'),
    });

    return {
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

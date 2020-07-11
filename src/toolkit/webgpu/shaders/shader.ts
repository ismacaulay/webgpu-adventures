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

    let depthWrite = true;
    let depthFunc: GPUCompareFunction = 'less';

    let stencilFront: GPUStencilStateFaceDescriptor = {
        compare: 'always',
        failOp: 'keep',
        depthFailOp: 'keep',
        passOp: 'keep',
    };
    let stencilBack: GPUStencilStateFaceDescriptor = {
        compare: 'always',
        failOp: 'keep',
        depthFailOp: 'keep',
        passOp: 'keep',
    };
    let stencilWriteMask = 0xff;
    let stencilReadMask = 0xff;
    let stencilValue = 1;

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

        update: (uniforms: UniformDictionary) => updateBuffers(buffers, uniforms),

        get depthWrite() {
            return depthWrite;
        },
        set depthWrite(value: boolean) {
            depthWrite = value;
        },

        get depthFunc() {
            return depthFunc;
        },
        set depthFunc(value: GPUCompareFunction) {
            depthFunc = value;
        },

        get stencilFront() {
            return stencilFront;
        },
        set stencilFront(value: GPUStencilStateFaceDescriptor) {
            stencilFront = value;
        },

        get stencilBack() {
            return stencilBack;
        },
        set stencilBack(value: GPUStencilStateFaceDescriptor) {
            stencilBack = value;
        },

        get stencilWriteMask() {
            return stencilWriteMask;
        },
        set stencilWriteMask(value: number) {
            stencilWriteMask = value;
        },

        get stencilReadMask() {
            return stencilReadMask;
        },
        set stencilReadMask(value: number) {
            stencilReadMask = value;
        },

        get stencilValue() {
            return stencilValue;
        },
        set stencilValue(value: number) {
            stencilValue = value;
        },
    };
}

// NOTE: Watch out with cloning shaders. They end up with the same id and if you change
//       anything up the unfiforms in your uniform buffer it will impact all shaders that
//       were cloned. This is cannot be easily changed because the current renderer only
//       builds and sets the pipeline if the shader id changed, which it doesnt.
export function cloneShader(device: GPUDevice, shader: Shader, bindings: ShaderBinding[]): Shader {
    const { id, bindGroupLayout, stages } = shader;

    let {
        depthFunc,
        depthWrite,
        stencilWriteMask,
        stencilValue,
        stencilReadMask,
        stencilFront,
        stencilBack,
    } = shader;

    const { buffers, entries } = processBindings(bindings);

    return {
        id,
        stages,
        bindGroupLayout,
        bindGroup: device.createBindGroup({ layout: bindGroupLayout, entries }),
        buffers,

        update: (uniforms: UniformDictionary) => updateBuffers(buffers, uniforms),

        get depthWrite() {
            return depthWrite;
        },
        set depthWrite(value: boolean) {
            depthWrite = value;
        },

        get depthFunc() {
            return depthFunc;
        },
        set depthFunc(value: GPUCompareFunction) {
            depthFunc = value;
        },

        get stencilFront() {
            return stencilFront;
        },
        set stencilFront(value: GPUStencilStateFaceDescriptor) {
            stencilFront = value;
        },

        get stencilBack() {
            return stencilBack;
        },
        set stencilBack(value: GPUStencilStateFaceDescriptor) {
            stencilBack = value;
        },

        get stencilWriteMask() {
            return stencilWriteMask;
        },
        set stencilWriteMask(value: number) {
            stencilWriteMask = value;
        },

        get stencilReadMask() {
            return stencilReadMask;
        },
        set stencilReadMask(value: number) {
            stencilReadMask = value;
        },

        get stencilValue() {
            return stencilValue;
        },
        set stencilValue(value: number) {
            stencilValue = value;
        },
    };
}

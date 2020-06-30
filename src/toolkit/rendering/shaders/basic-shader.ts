import { createShader } from './shader';
import { UniformBuffer, createUniformBuffer } from '../buffers';
import { mat4 } from 'gl-matrix';

export function createBasicShader(
    device: GPUDevice,
    glslang: any,
    viewProjectionBuffer: UniformBuffer,
) {
    const vertex = `
#version 450

layout(location = 0) in vec3 position;

layout(std140, set = 0, binding = 0) uniform Matrices
{
    mat4 view;
    mat4 projection;
};

layout(std140, set = 0, binding = 1) uniform UBO
{
    mat4 model;
};

void main()
{
    gl_Position = projection * view * model * vec4(position, 1.0);
}
`;

    const fragment = `
#version 450
layout(std140, set = 0, binding = 2) uniform Material
{
    vec3 color;
};

layout(location = 0) out vec4 o_color;

void main()
{
    o_color = vec4(color, 1.0);
}
`;

    // TODO: THESE BUFFERS NEED TO BE MANAGED!
    const modelBuffer = createUniformBuffer(device, { model: mat4.create() });
    const materialBuffer = createUniformBuffer(device, { color: [0, 0, 0] });
    const bindings = [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            type: 'uniform-buffer',
            buffer: viewProjectionBuffer,
        },
        {
            binding: 1,
            visibility: GPUShaderStage.VERTEX,
            type: 'uniform-buffer',
            buffer: modelBuffer,
        },
        {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            type: 'uniform-buffer',
            buffer: materialBuffer,
        },
    ];

    return createShader(device, glslang, {
        vertex,
        fragment,
        bindings,
    });
}

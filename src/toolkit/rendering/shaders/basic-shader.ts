import { UniformBuffer } from '../buffers';
import { mat4 } from 'gl-matrix';
import { BufferManager, DefaultBuffers } from 'toolkit/ecs/buffer-manager';

export function getBasicShaderInfo(bufferManager: BufferManager) {
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

    const viewProjectionBuffer = bufferManager.get<UniformBuffer>(
        DefaultBuffers.ViewProjection,
    );
    const modelBuffer = bufferManager.createUniformBuffer({
        model: mat4.create(),
    });
    const materialBuffer = bufferManager.createUniformBuffer({
        color: [0, 0, 0],
    });

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
            buffer: bufferManager.get(modelBuffer),
        },
        {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            type: 'uniform-buffer',
            buffer: bufferManager.get(materialBuffer),
        },
    ];

    return {
        vertex,
        fragment,
        bindings,
    };
}

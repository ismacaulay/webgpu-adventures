#version 450

layout(location = 0) in vec3 a_pos;

layout(std140, set = 0, binding = 0) uniform ViewProjection
{
    mat4 view;
    mat4 projection;
};

layout(std140, set = 0, binding = 1) uniform Uniforms
{
    mat4 model;
};

void main()
{
    gl_Position = projection * view * model * vec4(a_pos, 1.0);
}
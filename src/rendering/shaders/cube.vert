#version 450

layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_color;

layout(location = 0) out vec3 v_color;

layout(set = 0, binding = 0) uniform UBO
{
    mat4 model;
    mat4 view;
    mat4 projection;
};

void main()
{
    v_color = a_color;
    gl_Position = projection * view * model * vec4(a_pos, 1.0);
}
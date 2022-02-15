#version 450

layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

layout(std140, set = 0, binding = 0) uniform ViewProjection
{
    mat4 view;
    mat4 projection;
};

layout(std140, set = 0, binding = 1) uniform Uniforms
{
    mat4 model;
};

layout(location = 0) out vec3 v_normal;
layout(location = 1) out vec3 v_frag_pos;
layout(location = 2) out vec2 v_uv;

void main()
{
    // TODO: The inverse should be computed on the CPU as it is expensive
    v_normal = mat3(transpose(inverse(model))) * a_normal;
    v_frag_pos = vec3(model * vec4(a_pos, 1.0));

    v_uv = a_uv;

    gl_Position = projection * view * model * vec4(a_pos, 1.0);
}

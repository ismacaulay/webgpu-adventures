#version 450

layout(set = 0, binding = 2) uniform sampler u_sampler;
layout(set = 0, binding = 3) uniform texture2D u_texture;

layout(location = 2) in vec2 v_uv;

layout(location = 0) out vec4 o_color;

void main()
{
    o_color = vec4(vec3(texture(sampler2D(u_texture, u_sampler), v_uv)), 1.0);
}

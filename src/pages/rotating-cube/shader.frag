#version 450
layout(location = 0) in vec3 v_color;
layout(location = 1) in vec2 v_uv;

layout(set = 0, binding = 1) uniform sampler u_sampler;
layout(set = 0, binding = 2) uniform texture2D u_texture;
layout(set = 0, binding = 3) uniform UBO
{
    float u_texture_enabled;
};

layout(location = 0) out vec4 o_color;

void main()
{
    o_color = vec4(mix(v_color, vec3(texture(sampler2D(u_texture, u_sampler), v_uv)), u_texture_enabled), 1.0);
}
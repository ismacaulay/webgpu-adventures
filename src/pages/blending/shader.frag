#version 450

layout(set = 0, binding = 2) uniform sampler u_sampler;
layout(set = 0, binding = 3) uniform texture2D u_texture;

layout(location = 2) in vec2 v_uv;

layout(location = 0) out vec4 o_color;

void main()
{
    // dont need this since we are going to enable blending
    /* vec4 tex_color = texture(sampler2D(u_texture, u_sampler), v_uv); */
    /* if (tex_color.a < 0.1) */
    /*     discard; */
    /* o_color = tex_color; */
    o_color = texture(sampler2D(u_texture, u_sampler), v_uv);
}

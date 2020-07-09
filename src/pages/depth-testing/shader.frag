#version 450

layout(set = 0, binding = 2) uniform sampler u_sampler;
layout(set = 0, binding = 3) uniform texture2D u_texture;

layout(location = 2) in vec2 v_uv;

layout(location = 0) out vec4 o_color;

float near = 0.1;
float far = 100.0;

float linearizeDepth(float depth)
{
    float z = depth * 2.0 - 1.0; // back to NDC
    return (2.0 * near * far) / (far + near - z * (far - near));
}

void main()
{
    /* o_color = vec4(vec3(texture(sampler2D(u_texture, u_sampler), v_uv)), 1.0); */

    /* o_color = vec4(vec3(gl_FragCoord.z), 1.0); */

    float depth = linearizeDepth(gl_FragCoord.z) / far;
    o_color = vec4(vec3(depth), 1.0);
}

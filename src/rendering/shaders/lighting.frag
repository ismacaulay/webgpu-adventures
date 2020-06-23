#version 450
layout(std140, set = 0, binding = 2) uniform UBO
{
    vec3 object_color;
    vec3 light_color;
};

layout(location = 0) out vec4 o_color;

void main()
{
    o_color = vec4(object_color * light_color, 1.0);
}
#version 450
layout(std140, set = 0, binding = 2) uniform UBO
{
    vec3 object_color;
    vec3 light_color;
    vec3 light_pos;
    vec3 view_pos;
};

layout(location = 0) in vec3 v_normal;
layout(location = 1) in vec3 v_frag_pos;

layout(location = 0) out vec4 o_color;

void main()
{
    float ambient_strength = 0.1;
    vec3 ambient = ambient_strength * light_color;

    vec3 normal = normalize(v_normal);
    vec3 light_dir = normalize(light_pos - v_frag_pos);

    float diff = max(dot(normal, light_dir), 0.0);
    vec3 diffuse = diff * light_color;

    float specular_strength = 0.5;
    vec3 view_dir = normalize(view_pos - v_frag_pos);
    vec3 reflect_dir = reflect(-light_dir, v_normal);
    float spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32);
    vec3 specular = specular_strength * spec * light_color;

    vec3 result = (ambient + diffuse + specular) * object_color;
    o_color = vec4(result, 1.0);
}
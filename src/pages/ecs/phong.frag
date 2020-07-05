#version 450

struct Material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float shininess;
};

struct Light {
    vec3 position;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

layout(std140, set = 0, binding = 2) uniform UBO
{
    vec3 view_pos;
    Material material;
    Light light;
};

layout(location = 0) in vec3 v_normal;
layout(location = 1) in vec3 v_frag_pos;

layout(location = 0) out vec4 o_color;

void main()
{
    vec3 ambient = material.ambient * light.ambient;

    vec3 normal = normalize(v_normal);
    vec3 light_dir = normalize(light.position - v_frag_pos);

    float diff = max(dot(normal, light_dir), 0.0);
    vec3 diffuse = (diff * material.diffuse) * light.diffuse;

    vec3 view_dir = normalize(view_pos - v_frag_pos);
    vec3 reflect_dir = reflect(-light_dir, v_normal);
    float spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32);
    vec3 specular = (material.specular * spec) * light.specular;

    vec3 result = ambient + diffuse + specular;
    o_color = vec4(result, 1.0);
}
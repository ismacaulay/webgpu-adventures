#version 450

struct Material {
    float shininess;
};

struct Light {
    vec3 direction;

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

layout(set = 0, binding = 3) uniform sampler diffuse_sampler;
layout(set = 0, binding = 4) uniform texture2D diffuse_tex;

layout(set = 0, binding = 5) uniform sampler specular_sampler;
layout(set = 0, binding = 6) uniform texture2D specular_tex;

layout(location = 0) in vec3 v_normal;
layout(location = 1) in vec3 v_frag_pos;
layout(location = 2) in vec2 v_uv;

layout(location = 0) out vec4 o_color;

void main()
{
    vec3 normal = normalize(v_normal);
    vec3 light_dir = normalize(-light.direction);
    vec3 view_dir = normalize(view_pos - v_frag_pos);
    vec3 reflect_dir = reflect(-light_dir, v_normal);

    vec3 diff_map_color = vec3(texture(sampler2D(diffuse_tex, diffuse_sampler), v_uv));
    vec3 spec_map_color = vec3(texture(sampler2D(specular_tex, specular_sampler), v_uv));

    vec3 ambient = diff_map_color * light.ambient;

    float diff = max(dot(normal, light_dir), 0.0);
    vec3 diffuse = diff * diff_map_color * light.diffuse;

    float spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32);
    vec3 specular = spec_map_color * spec * light.specular;

    o_color = vec4(ambient + diffuse + specular, 1.0);
}

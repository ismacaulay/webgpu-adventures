#version 450

struct Material {
    float shininess;
};

struct DirLight {
    vec3 direction;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct PointLight {
    vec3 position;
    float kc;
    float kl;
    float kq;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct SpotLight {
    vec3 position;
    vec3 direction;
    float inner_cutoff;
    float outer_cutoff;
    float kc;
    float kl;
    float kq;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

layout(std140, set = 0, binding = 2) uniform UBO
{
    vec3 view_pos;
    Material material;
};

#define NUM_DIR_LIGHTS 1
#define NUM_POINT_LIGHTS 4
#define NUM_SPOT_LIGHTS 1

layout(std140, set = 0, binding = 3) uniform Lighting
{
    DirLight dir_lights[NUM_DIR_LIGHTS];
    PointLight point_lights[NUM_POINT_LIGHTS];
    SpotLight spot_lights[NUM_SPOT_LIGHTS];
};

layout(set = 0, binding = 4) uniform sampler diffuse_sampler;
layout(set = 0, binding = 5) uniform texture2D diffuse_tex;

layout(set = 0, binding = 6) uniform sampler specular_sampler;
layout(set = 0, binding = 7) uniform texture2D specular_tex;

layout(location = 0) in vec3 v_normal;
layout(location = 1) in vec3 v_frag_pos;
layout(location = 2) in vec2 v_uv;

layout(location = 0) out vec4 o_color;

vec3 calc_dir_light(DirLight light, vec3 normal, vec3 view_dir, vec3 diffuse_color, vec3 spec_color);
vec3 calc_point_light(PointLight light, vec3 normal, vec3 view_dir, vec3 diffuse_color, vec3 spec_color);
vec3 calc_spot_light(SpotLight light, vec3 normal, vec3 view_dir, vec3 frag_pos, vec3 diffuse_color, vec3 spec_color);

void main()
{
    vec3 normal = normalize(v_normal);
    vec3 view_dir = normalize(view_pos - v_frag_pos);

    vec3 diff_map_color = vec3(texture(sampler2D(diffuse_tex, diffuse_sampler), v_uv));
    vec3 spec_map_color = vec3(texture(sampler2D(specular_tex, specular_sampler), v_uv));

    vec3 result = vec3(0);

    for (int i = 0; i < NUM_DIR_LIGHTS; ++i) {
        result += calc_dir_light(dir_lights[i], normal, view_dir, diff_map_color, spec_map_color);
    }

    for (int i = 0; i < NUM_POINT_LIGHTS; ++i) {
        result += calc_point_light(point_lights[i], normal, view_dir, diff_map_color, spec_map_color);
    }

    for (int i = 0; i < NUM_SPOT_LIGHTS; ++i) {
        result += calc_spot_light(spot_lights[i], normal, view_dir, v_frag_pos, diff_map_color, spec_map_color);
    }

    o_color = vec4(result, 1.0);
}

vec3 calc_dir_light(DirLight light, vec3 normal, vec3 view_dir, vec3 diffuse_color, vec3 spec_color) {
    vec3 light_dir = normalize(-light.direction);
    vec3 reflect_dir = reflect(-light_dir, normal);

    vec3 ambient = light.ambient * diffuse_color;

    float diff = max(dot(normal, light_dir), 0.0);
    vec3 diffuse = light.diffuse * diff * diffuse_color;

    float spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32);
    vec3 specular = light.specular * spec * spec_color;

    return ambient + diffuse + specular;
}

vec3 calc_point_light(PointLight light, vec3 normal, vec3 view_dir, vec3 diffuse_color, vec3 spec_color) {
    vec3 light_dir = normalize(light.position - v_frag_pos);
    vec3 reflect_dir = reflect(-light_dir, normal);

    float distance = length(light.position - v_frag_pos);
    float attenuation = 1.0 / (light.kc + light.kl * distance + light.kq * distance * distance);

    vec3 ambient = light.ambient * diffuse_color;

    float diff = max(dot(normal, light_dir), 0.0);
    vec3 diffuse = light.diffuse * diff * diffuse_color;

    float spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32);
    vec3 specular = light.specular * spec * spec_color;

    ambient *= attenuation;
    diffuse *= attenuation;
    specular *= attenuation;

    return (ambient + diffuse + specular);
}

vec3 calc_spot_light(SpotLight light, vec3 normal, vec3 view_dir, vec3 frag_pos, vec3 diffuse_color, vec3 spec_color) {
    vec3 light_dir = normalize(light.position - v_frag_pos);
    float theta = dot(light_dir, normalize(-light.direction));
    float intensity = clamp((theta - light.outer_cutoff) / (light.inner_cutoff - light.outer_cutoff), 0.0, 1.0);

    vec3 reflect_dir = reflect(-light_dir, normal);

    float distance = length(light.position - frag_pos);
    float attenuation = 1.0 / (light.kc + light.kl * distance + light.kq * distance * distance);

    vec3 ambient = light.ambient * diffuse_color;

    float diff = max(dot(normal, light_dir), 0.0);
    vec3 diffuse = light.diffuse * diff * diffuse_color;

    float spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32);
    vec3 specular = light.specular * spec * spec_color;

    ambient *= attenuation * intensity;
    diffuse *= attenuation * intensity;
    specular *= attenuation * intensity;

    return (ambient + diffuse + specular);
}

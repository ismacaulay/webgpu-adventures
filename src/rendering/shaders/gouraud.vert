#version 450

layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_normal;

layout(std140, set = 0, binding = 0) uniform ViewProjection
{
    mat4 view;
    mat4 projection;
};

layout(std140, set = 0, binding = 1) uniform Uniforms
{
    mat4 model;
    vec3 light_color;
    vec3 light_pos;
    vec3 view_pos;
};

layout(location = 0) out vec3 v_lighting_color;

void main()
{
    // TODO: The inverse should be computed on the CPU as it is expensive
    vec3 normal = normalize(mat3(transpose(inverse(model))) * a_normal);
    vec3 position = vec3(model * vec4(a_pos, 1.0));

    float ambient_strength = 0.1;
    vec3 ambient = ambient_strength * light_color;

    vec3 light_dir = normalize(light_pos - position);

    float diff = max(dot(normal, light_dir), 0.0);
    vec3 diffuse = diff * light_color;

    float specular_strength = 0.5;
    vec3 view_dir = normalize(view_pos - position);
    vec3 reflect_dir = reflect(-light_dir, normal);
    float spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32);
    vec3 specular = specular_strength * spec * light_color;

    v_lighting_color = ambient + diffuse + specular;

    gl_Position = projection * view * model * vec4(a_pos, 1.0);
}
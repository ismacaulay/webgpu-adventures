struct ViewProjection {
  view: mat4x4<f32>;
  projection: mat4x4<f32>;
};
@group(0) @binding(0)
var<uniform> vp: ViewProjection;

struct Model {
  model: mat4x4<f32>;
  normal_matrix: mat4x4<f32>;
}
@group(0) @binding(1)
var<uniform> m: Model;

struct VertexOutput {
  @builtin(position) position: vec4<f32>;
  @location(0) normal: vec3<f32>;
  @location(1) frag_pos: vec3<f32>;
  @location(2) uv: vec2<f32>;
}

@stage(vertex)
fn vertex_main(
  @location(0) a_pos: vec3<f32>,
  @location(1) a_normal: vec3<f32>,
  @location(2) a_uv: vec2<f32>
) -> VertexOutput {
  var out: VertexOutput;
  out.position = vp.projection * vp.view * m.model * vec4(a_pos, 1.0);
  out.normal = normalize(m.normal_matrix * vec4(a_normal, 1.0)).xyz;
  out.frag_pos = (m.model * vec4(a_pos, 1.0)).xyz;
  out.uv = a_uv;
  return out;
}

struct DirectionalLight {
  direction: vec3<f32>;
  ambient: vec3<f32>;
  diffuse: vec3<f32>;
  specular: vec3<f32>;
}

struct PointLight {
  position: vec3<f32>;

  kc: f32;
  kl: f32;
  kq: f32;

  ambient: vec3<f32>;
  diffuse: vec3<f32>;
  specular: vec3<f32>;
}

struct SpotLight {
  position: vec3<f32>;

  direction: vec3<f32>;
  inner_cutoff: f32;
  outer_cutoff: f32;
  kc: f32;
  kl: f32;
  kq: f32;

  ambient: vec3<f32>;
  diffuse: vec3<f32>;
  specular: vec3<f32>;
}

struct LightColour {
  ambient: vec3<f32>;
  diffuse: vec3<f32>;
  specular: vec3<f32>;
}

let NUM_DIR_LIGHTS: i32 = 1;
let NUM_POINT_LIGHTS: i32 = 4;
let NUM_SPOT_LIGHTS: i32 = 1;
struct UBO {
  view_pos: vec3<f32>;

  shininess: f32;
  light_colour: LightColour;

  directional_lights: array<DirectionalLight, 1>;
  point_lights: array<PointLight, 4>;
  spot_lights: array<SpotLight, 1>;
}
@group(0) @binding(2)
var<uniform> u: UBO;

@group(0) @binding(3)
var u_sampler: sampler;
@group(0) @binding(4)
var diffuse_tex: texture_2d<f32>;
@group(0) @binding(5)
var specular_tex: texture_2d<f32>;

@stage(fragment)
fn fragment_main(
  @location(0) normal: vec3<f32>,
  @location(1) frag_pos: vec3<f32>,
  @location(2) uv: vec2<f32>
) -> @location(0) vec4<f32> {

  var n = normalize(normal);
  var view_dir = normalize(u.view_pos - frag_pos);

  var result = vec3<f32>(0.0, 0.0, 0.0);

  var diff_map_colour = textureSample(diffuse_tex, u_sampler, uv).xyz;
  var spec_map_colour = textureSample(specular_tex, u_sampler, uv).xyz;

  for (var i: i32 = 0; i < NUM_DIR_LIGHTS; i = i + 1) {
    result = result + calc_dir_light(u.directional_lights[i], n, view_dir, diff_map_colour, spec_map_colour);
  }

  for (var i: i32 = 0; i < NUM_POINT_LIGHTS; i = i + 1) {
    result = result + calc_point_light(u.point_lights[i], frag_pos, n, view_dir, diff_map_colour, spec_map_colour);
  }

  for (var i: i32 = 0; i < NUM_SPOT_LIGHTS; i = i + 1) {
    result = result + calc_spot_light(u.spot_lights[i], normal, view_dir, frag_pos, diff_map_colour, spec_map_colour);
  }

  return vec4(result, 1.0);
}

fn calc_dir_light(
  light: DirectionalLight, 
  normal: vec3<f32> , 
  view_dir: vec3<f32> , 
  diffuse_color: vec3<f32> , 
  spec_color: vec3<f32> 
) -> vec3<f32> {
    var light_dir = normalize(-light.direction);
    var reflect_dir = reflect(-light_dir, normal);

    var ambient = light.ambient * diffuse_color;

    var diff = max(dot(normal, light_dir), 0.0);
    var diffuse = light.diffuse * diff * diffuse_color;

    var spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0);
    var specular = light.specular * spec * spec_color;

    return ambient + diffuse + specular;
}

fn calc_point_light(
  light: PointLight,
  frag_pos: vec3<f32>, 
  normal: vec3<f32>, 
  view_dir: vec3<f32>, 
  diffuse_color: vec3<f32>, 
  spec_color: vec3<f32>
) -> vec3<f32> {
    var light_dir = normalize(light.position - frag_pos);
    var reflect_dir = reflect(-light_dir, normal);

    var distance = length(light.position - frag_pos);
    var attenuation = 1.0 / (light.kc + light.kl * distance + light.kq * distance * distance);
    var ambient = light.ambient * diffuse_color;

    var diff = max(dot(normal, light_dir), 0.0);
    var diffuse = light.diffuse * diff * diffuse_color;

    var spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0);
    var specular = light.specular * spec * spec_color;

    ambient = ambient * attenuation;
    diffuse = diffuse * attenuation;
    specular = specular * attenuation;

    return (ambient + diffuse + specular);
}

fn calc_spot_light(
  light: SpotLight, 
  normal: vec3<f32>, 
  view_dir: vec3<f32>, 
  frag_pos: vec3<f32>, 
  diffuse_color: vec3<f32>, 
  spec_color: vec3<f32>
) -> vec3<f32> {
    var light_dir = normalize(light.position - frag_pos);
    var theta = dot(light_dir, normalize(-light.direction));
    var intensity = clamp((theta - light.outer_cutoff) / (light.inner_cutoff - light.outer_cutoff), 0.0, 1.0);

    var reflect_dir = reflect(-light_dir, normal);

    var distance = length(light.position - frag_pos);
    var attenuation = 1.0 / (light.kc + light.kl * distance + light.kq * distance * distance);

    var ambient = light.ambient * diffuse_color;

    var diff = max(dot(normal, light_dir), 0.0);
    var diffuse = light.diffuse * diff * diffuse_color;

    var spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0);
    var specular = light.specular * spec * spec_color;

    ambient = ambient * attenuation * intensity;
    diffuse = diffuse * attenuation * intensity;
    specular = specular * attenuation * intensity;

    return (ambient + diffuse + specular);
}

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
}

struct PointLight {
  position: vec3<f32>;
  kc: f32;
  kl: f32;
  kq: f32;
}

struct SpotLight {
  position: vec3<f32>;
  direction: vec3<f32>;
  inner_cutoff: f32;
  outer_cutoff: f32;
}

struct LightColour {
  ambient: vec3<f32>;
  diffuse: vec3<f32>;
  specular: vec3<f32>;
}

struct UBO {
  view_pos: vec3<f32>;

  shininess: f32;

  light_type: f32;
  directional: DirectionalLight;
  point: PointLight;
  spot: SpotLight;
  light_colour: LightColour;
}
@group(0) @binding(2)
var<uniform> u: UBO;

@group(0) @binding(3)
var u_sampler: sampler;
@group(0) @binding(4)
var diffuse_tex: texture_2d<f32>;
@group(0) @binding(5)
var specular_tex: texture_2d<f32>;

// TODO: for some reason i32/u32 does not work in if statements
let DIR_LIGHT: f32 = 0.0;
let POINT_LIGHT: f32 = 1.0;
let SPOT_LIGHT: f32 = 2.0;

@stage(fragment)
fn fragment_main(
  @location(0) normal: vec3<f32>,
  @location(1) frag_pos: vec3<f32>,
  @location(2) uv: vec2<f32>
) -> @location(0) vec4<f32> {
  var n = normalize(normal);

  var light_dir: vec3<f32>;

  if (u.light_type == DIR_LIGHT) {
    light_dir = normalize(-u.directional.direction);
  } else if (u.light_type == POINT_LIGHT) {
    light_dir = normalize(u.point.position - frag_pos);
  } else if (u.light_type == SPOT_LIGHT) {
    light_dir = normalize(u.spot.position - frag_pos);
  }

  var view_dir = normalize(u.view_pos - frag_pos);
  var reflect_dir = reflect(-light_dir, n);

  var diff_map_colour = textureSample(diffuse_tex, u_sampler, uv).xyz;
  var spec_map_colour = textureSample(specular_tex, u_sampler, uv).xyz;

  var ambient = diff_map_colour * u.light_colour.ambient;

  var diff = max(dot(n, light_dir), 0.0);
  var diffuse = diff * diff_map_colour * u.light_colour.diffuse;

  var spec = pow(max(dot(view_dir, reflect_dir), 0.0), u.shininess);
  var specular = spec_map_colour * spec * u.light_colour.specular;

  if (u.light_type == POINT_LIGHT) {
    var distance = length(u.point.position - frag_pos);
    var attenuation = 1.0 / (u.point.kc + (u.point.kl * distance) + (u.point.kq * distance * distance));
    ambient = ambient * attenuation;
    diffuse = diffuse * attenuation;
    specular = specular * attenuation;
  } else if (u.light_type == SPOT_LIGHT) {
    var theta = dot(light_dir, normalize(-u.spot.direction));
    var intensity = clamp((theta - u.spot.outer_cutoff) / (u.spot.inner_cutoff - u.spot.outer_cutoff), 0.0, 1.0);

    diffuse = diffuse * intensity;
    specular = specular * intensity;
  }

  return vec4(ambient + diffuse + specular, 1.0);
  // if (u.light_type == DIR_LIGHT) {
  //   return vec4(1.0, 0.0, 0.0, 1.0);
  // } else if (u.light_type == POINT_LIGHT) {
  //   return vec4(0.0, 1.0, 0.0, 1.0);
  // } else if (u.light_type == SPOT_LIGHT) {
  //   return vec4(0.0, 0.0, 1.0, 1.0);
  // } else {
  //   return vec4(1.0, 0.0, 1.0, 1.0);
  // }
}

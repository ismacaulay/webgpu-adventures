struct UBO {
  model: mat4x4<f32>;
  normal_matrix: mat4x4<f32>;

  view_pos: vec3<f32>;

  light_pos: vec3<f32>;
  light_ambient: vec3<f32>;
  light_diffuse: vec3<f32>;
  light_specular: vec3<f32>;

  shininess: f32;
}
@group(0) @binding(0)
var<uniform> u: UBO;

struct Matrices {
  view: mat4x4<f32>;
  projection: mat4x4<f32>;
};
@group(0) @binding(1)
var<uniform> m: Matrices;

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
  out.position = m.projection * m.view * u.model * vec4(a_pos, 1.0);
  out.normal = normalize(u.normal_matrix * vec4(a_normal, 1.0)).xyz;
  out.frag_pos = (u.model * vec4(a_pos, 1.0)).xyz;
  out.uv = a_uv;
  return out;
}

@group(0) @binding(2)
var u_sampler: sampler;
@group(0) @binding(3)
var diffuse_tex: texture_2d<f32>;
@group(0) @binding(4)
var specular_tex: texture_2d<f32>;

@stage(fragment)
fn fragment_main(
  @location(0) normal: vec3<f32>,
  @location(1) frag_pos: vec3<f32>,
  @location(2) uv: vec2<f32>
) -> @location(0) vec4<f32> {
  var n = normalize(normal);
  var light_dir = normalize(u.light_pos - frag_pos);
  var view_dir = normalize(u.view_pos - frag_pos);
  var reflect_dir = reflect(-light_dir, n);

  var diff_map_colour = textureSample(diffuse_tex, u_sampler, uv).xyz;
  var spec_map_colour = textureSample(specular_tex, u_sampler, uv).xyz;

  var ambient = diff_map_colour * u.light_ambient;

  var diff = max(dot(n, light_dir), 0.0);
  var diffuse = diff * diff_map_colour * u.light_diffuse;

  var spec = pow(max(dot(view_dir, reflect_dir), 0.0), u.shininess);
  var specular = spec_map_colour * spec * u.light_specular;

  return vec4(ambient + diffuse + specular, 1.0);
}
struct UBO {
  model: mat4x4<f32>;
  normal_matrix: mat4x4<f32>;
  
  view_pos: vec3<f32>;

  light_pos: vec3<f32>;
  light_ambient: vec3<f32>;
  light_diffuse: vec3<f32>;
  light_specular: vec3<f32>;

  mat_ambient: vec3<f32>;
  mat_diffuse: vec3<f32>;
  mat_specular: vec3<f32>;
  mat_shininess: f32;
}
@group(0) @binding(0)
var<uniform> ubo: UBO;

struct Matrices {
  view: mat4x4<f32>;
  projection: mat4x4<f32>;
};
@group(0) @binding(1)
var<uniform> matrices: Matrices;

struct VertexOutput {
  @builtin(position) position: vec4<f32>;
  @location(0) normal: vec3<f32>;
  @location(1) frag_pos: vec3<f32>;
}

@stage(vertex)
fn vertex_main(
  @location(0) a_pos: vec3<f32>, 
  @location(1) a_normal: vec3<f32>,
) -> VertexOutput {
  var out: VertexOutput;

  out.normal = normalize(ubo.normal_matrix * vec4<f32>(a_normal, 1.0)).xyz; 
  out.frag_pos = (ubo.model * vec4<f32>(a_pos, 1.0)).xyz;
  out.position = matrices.projection * matrices.view * ubo.model * vec4<f32>(a_pos, 1.0);

  return out;
}

@stage(fragment)
fn fragment_main(
  @location(0) normal: vec3<f32>, 
  @location(1) frag_pos: vec3<f32>
) -> @location(0) vec4<f32> {
  var ambient = ubo.mat_ambient * ubo.light_ambient;

  var n = normalize(normal);
  var light_dir = normalize(ubo.light_pos - frag_pos);

  var diff = max(dot(n, light_dir), 0.0);
  var diffuse = diff * ubo.mat_diffuse * ubo.light_diffuse;

  var view_dir = normalize(ubo.view_pos - frag_pos);
  var reflect_dir = reflect(-light_dir, n);
  var spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0);
  var specular = spec * ubo.mat_specular * ubo.light_specular;

  return vec4(ambient + diffuse + specular, 1.0);
}
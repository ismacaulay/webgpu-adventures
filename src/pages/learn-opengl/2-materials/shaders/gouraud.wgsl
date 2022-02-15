
struct UBO {
  model: mat4x4<f32>;
  normal_matrix: mat4x4<f32>;
  
  object_colour: vec3<f32>;
  
  light_colour: vec3<f32>;
  light_pos: vec3<f32>;
  view_pos: vec3<f32>;
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
  @location(0) lighting_colour: vec3<f32>;
}

@stage(vertex)
fn vertex_main(
  @location(0) a_pos: vec3<f32>, 
  @location(1) a_normal: vec3<f32>,
) -> VertexOutput {
  var normal = normalize(ubo.normal_matrix * vec4<f32>(a_normal, 1.0)).xyz; 
  var position = (ubo.model * vec4<f32>(a_pos, 1.0)).xyz;

  var ambient_strength = 0.1;
  var ambient = ambient_strength * ubo.light_colour;

  var light_dir = normalize(ubo.light_pos - position);

  var diff = max(dot(normal, light_dir), 0.0);
  var diffuse = diff * ubo.light_colour;

  var specular_strength = 0.5;
  var view_dir = normalize(ubo.view_pos - position);
  var reflect_dir = reflect(-light_dir, normal);
  var spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0);
  var specular = specular_strength * spec * ubo.light_colour;

  var out: VertexOutput;
  out.position = matrices.projection * matrices.view * vec4(position, 1.0);
  out.lighting_colour = ambient + diffuse + specular;

  return out;
}

@stage(fragment)
fn fragment_main(
  @location(0) lighting_colour: vec3<f32>
) -> @location(0) vec4<f32> {
  return vec4<f32>(lighting_colour * ubo.object_colour, 1.0);
}
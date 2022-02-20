struct UBO {
  model: mat4x4<f32>;
  
  light_colour: vec3<f32>;
}
@group(0) @binding(0)
var<uniform> ubo: UBO;

struct Matrices {
  view: mat4x4<f32>;
  projection: mat4x4<f32>;
};
@group(0) @binding(1)
var<uniform> matrices: Matrices;

@stage(vertex)
fn vertex_main(@location(0) a_pos: vec3<f32>) -> @builtin(position) vec4<f32> {
  return matrices.projection * matrices.view * ubo.model * vec4<f32>(a_pos, 1.0);
}

@stage(fragment)
fn fragment_main() -> @location(0) vec4<f32> {
  return vec4<f32>(ubo.light_colour, 1.0);
}
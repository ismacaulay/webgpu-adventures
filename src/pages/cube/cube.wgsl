struct Matrices {
  view: mat4x4<f32>;
  projection: mat4x4<f32>;
};

@group(0) @binding(0)
var<uniform> model: mat4x4<f32>;
@group(0) @binding(1)
var<uniform> matrices: Matrices;

struct VertexOutput {
  @builtin(position) position: vec4<f32>;
  @location(0) fragColor: vec4<f32>;
};

@stage(vertex)
fn vertex_main(@location(0) position: vec3<f32>,
               @location(1) color: vec3<f32>,
               @location(2) uv: vec2<f32>) -> VertexOutput {
  var output : VertexOutput;
  output.position = matrices.projection * matrices.view * model * vec4<f32>(position, 1.0);
  // output.position = vec4<f32>(position, 1.0);
//   output.fragColor = vec4<f32>(color, 1.0);
  output.fragColor = 0.5 * (vec4<f32>(position, 1.0) + vec4<f32>(1.0, 1.0, 1.0, 1.0));
  return output;
}

@stage(fragment)
fn fragment_main(@location(0) fragColor: vec4<f32>) -> @location(0) vec4<f32> {
  return fragColor;
}

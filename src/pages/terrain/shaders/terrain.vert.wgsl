struct UBO {
  model: mat4x4<f32>;
}
@group(0) @binding(0)
var<uniform> u: UBO;

struct Matrices {
  view: mat4x4<f32>;
  projection: mat4x4<f32>;
}
@group(0) @binding(1)
var<uniform> matrices: Matrices;

struct VertexOutput {
  @builtin(position) position: vec4<f32>;
  @location(0) barycentric: vec3<f32>;
  @location(1) noise: f32;
  @location(2) position_eye: vec4<f32>;
}

@stage(vertex)
fn main(@builtin(vertex_index) v_idx: u32, @location(0) position: vec3<f32>, @location(1) noise: f32) -> VertexOutput {
  var out: VertexOutput;

  out.position = matrices.projection * matrices.view * u.model * vec4<f32>(position, 1.0);
  out.position_eye = matrices.view * u.model * vec4<f32>(position, 1.0);
  out.noise = noise;

  var barycentric = v_idx % 3u;
  if (barycentric == 0u) {
    out.barycentric = vec3<f32>(1f, 0f, 0f);
  } else if (barycentric == 1u) {
    out.barycentric = vec3<f32>(0f, 1f, 0f);
  } else {
    out.barycentric = vec3<f32>(0f, 0f, 1f);
  }
  return out;
}

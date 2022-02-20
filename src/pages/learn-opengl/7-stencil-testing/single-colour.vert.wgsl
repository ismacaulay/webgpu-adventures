struct ViewProjection {
  view: mat4x4<f32>;
  projection: mat4x4<f32>;
};
@group(0) @binding(0)
var<uniform> vp: ViewProjection;

struct UBO {
  model: mat4x4<f32>;
}
@group(0) @binding(1)
var<uniform> u: UBO;

struct VertexOutput {
  @builtin(position) position: vec4<f32>;
}

@stage(vertex)
fn vertex_main(
  @location(0) a_pos: vec3<f32>,
) -> VertexOutput {
  var out: VertexOutput;
  out.position = vp.projection * vp.view * u.model * vec4(a_pos, 1.0);
  return out;
}

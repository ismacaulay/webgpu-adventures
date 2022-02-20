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
  @location(0) uv: vec2<f32>;
}

@stage(vertex)
fn vertex_main(
  @location(0) a_pos: vec3<f32>,
  @location(1) a_uv: vec2<f32>
) -> VertexOutput {
  var out: VertexOutput;
  out.position = vp.projection * vp.view * u.model * vec4(a_pos, 1.0);
  out.uv = a_uv;
  return out;
}

@group(0) @binding(2)
var u_sampler: sampler;
@group(0) @binding(3)
var u_texture: texture_2d<f32>;

@stage(fragment)
fn fragment_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  var colour = textureSample(u_texture, u_sampler, uv).xyz;
  return vec4(colour, 1.0);
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>;
  @location(0) uv: vec2<f32>;
}

@stage(vertex)
fn vertex_main(
  @location(0) a_pos: vec2<f32>,
  @location(1) a_uv: vec2<f32>
) -> VertexOutput {
  var out: VertexOutput;
  out.position = vec4(a_pos.x, a_pos.y, 0.0, 1.0);
  out.uv = a_uv;
  return out;
}

@group(0) @binding(0)
var u_sampler: sampler;
@group(0) @binding(1)
var u_texture: texture_2d<f32>;

@stage(fragment)
fn fragment_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return textureSample(u_texture, u_sampler, uv);
}

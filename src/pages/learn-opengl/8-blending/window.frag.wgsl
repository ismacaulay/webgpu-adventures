@group(0) @binding(2)
var u_sampler: sampler;
@group(0) @binding(3)
var u_texture: texture_2d<f32>;

@stage(fragment)
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return textureSample(u_texture, u_sampler, uv);
}

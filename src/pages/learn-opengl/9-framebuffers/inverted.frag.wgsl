@group(0) @binding(0)
var u_sampler: sampler;
@group(0) @binding(1)
var u_texture: texture_2d<f32>;

@stage(fragment)
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return vec4(1.0 - textureSample(u_texture, u_sampler, uv).xyz, 1.0);
}

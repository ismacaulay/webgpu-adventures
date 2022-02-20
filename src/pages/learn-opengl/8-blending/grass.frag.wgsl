@group(0) @binding(2)
var u_sampler: sampler;
@group(0) @binding(3)
var u_texture: texture_2d<f32>;

@stage(fragment)
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  var colour = textureSample(u_texture, u_sampler, uv);
  if (colour.a < 0.1) {
    discard;
  }
  return vec4(colour.rgb, 1.0);
}

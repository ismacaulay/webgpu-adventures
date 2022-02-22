@group(0) @binding(0)
var u_sampler: sampler;
@group(0) @binding(1)
var u_texture: texture_2d<f32>;

@stage(fragment)
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  var colour = textureSample(u_texture, u_sampler, uv);
  var average = 0.2126 * colour.r + 0.7152 * colour.g + 0.0722 * colour.b;
  return vec4(average, average, average, 1.0);
}

@group(0) @binding(0)
var u_sampler: sampler;
@group(0) @binding(1)
var u_texture: texture_2d<f32>;


@stage(fragment)
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  var offset = 1.0 / 300.0;
  var offsets = array<vec2<f32>, 9>(
    vec2(-offset,  offset), // top-left
    vec2( 0.0f,    offset), // top-center
    vec2( offset,  offset), // top-right
    vec2(-offset,  0.0f),   // center-left
    vec2( 0.0f,    0.0f),   // center-center
    vec2( offset,  0.0f),   // center-right
    vec2(-offset, -offset), // bottom-left
    vec2( 0.0f,   -offset), // bottom-center
    vec2( offset, -offset)  // bottom-right    
  );
  var kernel = array<f32, 9>(
    1.0, 1.0, 1.0,
    1.0, -8.0, 1.0,
    1.0, 1.0, 1.0
  );
  
  var sample: array<vec3<f32>, 9>;
  for(var i: i32 = 0; i < 9; i = i + 1) {
    sample[i] = textureSample(u_texture, u_sampler, uv + offsets[i]).rgb;
  }
  
  var colour = vec3(0.0);
  for(var i: i32 = 0; i < 9; i = i + 1) {
    colour = colour + sample[i] * kernel[i];
  }
    
  return vec4(colour, 1.0);
}

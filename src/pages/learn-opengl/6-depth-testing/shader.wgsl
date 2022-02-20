struct ViewProjection {
  view: mat4x4<f32>;
  projection: mat4x4<f32>;
};
@group(0) @binding(0)
var<uniform> vp: ViewProjection;

struct UBO {
  model: mat4x4<f32>;

  render_mode: f32;
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
fn fragment_main(@builtin(position) frag_coord: vec4<f32>, @location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {

  if (u.render_mode == 1.0) {
      return vec4(frag_coord.z, frag_coord.z, frag_coord.z, 1.0);
  } else if (u.render_mode == 2.0) {
    var near = 0.1; 
    var far  = 100.0; 
    // convert to NDC
    var ndc = frag_coord.z * 2.0 - 1.0; 
    // reverse the projection
    var linear_depth = ((2.0 * near * far) / (far + near - ndc * (far - near))) / far;
    return vec4(linear_depth, linear_depth, linear_depth, 1.0);
  }

  var colour = textureSample(u_texture, u_sampler, uv).xyz;
  return vec4(colour, 1.0);
}

struct Matrices {
  view: mat4x4<f32>;
  projection: mat4x4<f32>;
};

@group(0) @binding(0)
var<uniform> model: mat4x4<f32>;
@group(0) @binding(1)
var<uniform> matrices: Matrices;

struct VertexOutput {
  @builtin(position) position: vec4<f32>;
  @location(0) colour: vec3<f32>;
  @location(1) uv: vec2<f32>;
}

@stage(vertex)
fn vertex_main(
  @location(0) position: vec3<f32>, 
  @location(1) colour: vec3<f32>,
  @location(2) uv: vec2<f32>
) -> VertexOutput {
  var out: VertexOutput;

  out.position = matrices.projection * matrices.view * model * vec4(position, 1.0);
  out.colour = colour;
  out.uv = uv;
  return out;
}

@group(0) @binding(2)
var u_sampler: sampler;
@group(0) @binding(3)
var u_texture: texture_2d<f32>;
@group(0) @binding(4)
var<uniform> u_texture_enabled: f32;

@stage(fragment)
fn fragment_main(
  @location(0) colour: vec3<f32>,
  @location(1) uv: vec2<f32>
) -> @location(0) vec4<f32> {
  return vec4<f32>(mix(colour, textureSample(u_texture, u_sampler, uv).xyz, u_texture_enabled), 1.0);
}

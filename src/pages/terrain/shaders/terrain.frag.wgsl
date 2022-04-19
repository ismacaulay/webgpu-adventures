
struct UBO {
  wireframe: u32,
  enable_lighting: u32,

  light1_enabled: u32,
  light1: vec4<f32>,
  light2_enabled: u32,
  light2: vec4<f32>,
}
@group(0) @binding(2)
var<uniform> u: UBO;

@group(0) @binding(3)
var u_sampler: sampler;
@group(0) @binding(4)
var u_texture: texture_2d<f32>;

let WIREFRAME_COLOR = vec3<f32>(0.33, 0.33, 0.33);
let SURFACE_COLOR = vec3<f32>(1.0, 1.0, 1.0);
let THICKNESS = 1.0;
let MIN_DIFFUSE = 0.3;

@stage(fragment)
fn main(
  @location(0) barycentric: vec3<f32>,
  @location(1) noise: f32,
  @location(2) position_eye: vec4<f32>
) -> @location(0) vec4<f32> {
  // barycentric wireframe:
  // - https://web.archive.org/web/20200708050342/http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/
  // - https://tchayen.github.io/posts/wireframes-with-barycentric-coordinates

  var w = 1.0;
  if (u.wireframe > 0u) {
    var f = fwidth(barycentric);
    var a = smoothstep(vec3<f32>(0f, 0f, 0f), f * THICKNESS, barycentric);
    w = min(a.x, min(a.y, a.z));
  }

  // compute normal
  var kd = 1.0;
  if (u.enable_lighting > 0u) {
    // compute diffuse only shading. The diffuse coefficents are all the same
    // in the light w component
    kd = 0.0;
    var normal = normalize(cross(dpdx(position_eye.xyz), dpdy(position_eye.xyz)));
    if (u.light1_enabled > 0u) {
      kd = kd + u.light1.w * max(dot(normal, normalize(u.light1.xyz)), MIN_DIFFUSE);
    }
    if (u.light2_enabled > 0u) {
      kd = kd + u.light2.w * max(dot(normal, normalize(u.light2.xyz)), MIN_DIFFUSE);
    }
  }

  var c = textureSample(u_texture, u_sampler, vec2<f32>(1.0-noise, 0.5));
  return vec4<f32>(kd * mix(WIREFRAME_COLOR, c.xyz, w), 1.0);
}

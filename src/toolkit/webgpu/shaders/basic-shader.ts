import { mat4, vec3 } from 'gl-matrix';
import type { ShaderId } from 'toolkit/types/ecs/components';
import { BufferManager, DefaultBuffers, ShaderManager } from 'toolkit/types/ecs/managers';
import { UniformType } from 'toolkit/types/webgpu/buffers';
import { ShaderBindingType } from 'toolkit/types/webgpu/shaders';

export function createBasicShader({
  shaderManager,
  bufferManager,
}: {
  shaderManager: ShaderManager;
  bufferManager: BufferManager;
}): ShaderId {
  const vertexSource = `
@group(0) @binding(0)
var<uniform> model: mat4x4<f32>;

struct Matrices {
  view: mat4x4<f32>;
  projection: mat4x4<f32>;
};
@group(0) @binding(1)
var<uniform> m: Matrices;

struct VertexOutput {
  @builtin(position) position: vec4<f32>;
  @location(0) barycentric: vec3<f32>;
  @location(1) position_eye: vec4<f32>;
}

@stage(vertex)
fn main(@builtin(vertex_index) v_idx: u32, @location(0) a_pos: vec3<f32>) -> VertexOutput {
  var out: VertexOutput;
  out.position = m.projection * m.view * model * vec4(a_pos, 1.0);
  out.position_eye = m.view * model * vec4<f32>(a_pos, 1.0);

  var barycentric = v_idx % 3u;
  if (barycentric == 0u) {
    out.barycentric = vec3<f32>(1f, 0f, 0f);
  } else if (barycentric == 1u) {
    out.barycentric = vec3<f32>(0f, 1f, 0f);
  } else {
    out.barycentric = vec3<f32>(0f, 0f, 1f);
  }

  return out;
}
  `;

  const fragmentSource = `
struct UBO {
  wireframe: u32;
  colour: vec3<f32>;
  opacity: f32;
}
@group(0) @binding(2)
var<uniform> u: UBO;

let WIREFRAME_COLOR = vec3<f32>(0.33, 0.33, 0.33);
let THICKNESS = 1.0;

let LIGHT1 = vec4<f32>(0.33, 0.25, 0.9, 0.75);
let LIGHT2 = vec4<f32>(-0.55, -0.25, -0.79, 0.75);
let MIN_DIFFUSE = 0.0;

@stage(fragment)
fn main(@location(0) barycentric: vec3<f32>, @location(1) position_eye: vec4<f32>) -> @location(0) vec4<f32> {
  var w = 1.0;
  if (u.wireframe > 0u) {
    var f = fwidth(barycentric);
    var a = smoothStep(vec3<f32>(0f, 0f, 0f), f * THICKNESS, barycentric);
    w = min(a.x, min(a.y, a.z));
  }

  // compute diffuse only shading. The diffuse coefficents are all the same
  // in the light w component
  var kd = 0.0;
  var normal = normalize(cross(dpdx(position_eye.xyz), dpdy(position_eye.xyz)));
  kd = kd + LIGHT1.w * max(dot(normal, normalize(LIGHT1.xyz)), MIN_DIFFUSE);
  kd = kd + LIGHT2.w * max(dot(normal, normalize(LIGHT2.xyz)), MIN_DIFFUSE);
  return vec4<f32>(kd * mix(WIREFRAME_COLOR, u.colour, w), u.opacity);
}
  `;

  const vertexUBO = bufferManager.createUniformBuffer(
    {
      model: UniformType.Mat4,
    },
    {
      model: mat4.create(),
    },
  );
  const fragmentUBO = bufferManager.createUniformBuffer(
    {
      wireframe: UniformType.Bool,
      colour: UniformType.Vec3,
      opacity: UniformType.Scalar,
    },
    {
      wireframe: false,
      colour: vec3.create(),
      opacity: 1.0,
    },
  );
  return shaderManager.create({
    vertex: {
      source: vertexSource,
      entryPoint: 'main',
    },
    fragment: {
      source: fragmentSource,
      entryPoint: 'main',
    },
    bindings: [
      {
        type: ShaderBindingType.UniformBuffer,
        resource: vertexUBO,
      },
      {
        type: ShaderBindingType.UniformBuffer,
        resource: DefaultBuffers.ViewProjection,
      },
      {
        type: ShaderBindingType.UniformBuffer,
        resource: fragmentUBO,
      },
    ],
  });
}

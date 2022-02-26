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
}

@stage(vertex)
fn main(@location(0) a_pos: vec3<f32>) -> VertexOutput {
  var out: VertexOutput;
  out.position = m.projection * m.view * model * vec4(a_pos, 1.0);
  return out;
}
  `;

  const fragmentSource = `
struct UBO {
  colour: vec3<f32>;
  opacity: f32;
}
@group(0) @binding(2)
var<uniform> ubo: UBO;

@stage(fragment)
fn main() -> @location(0) vec4<f32> {
  return vec4<f32>(ubo.colour, ubo.opacity);
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
      colour: UniformType.Vec3,
      opacity: UniformType.Scalar,
    },
    {
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

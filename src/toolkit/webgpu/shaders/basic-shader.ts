import { mat4, vec3 } from 'gl-matrix';
import type { ShaderId } from 'toolkit/types/ecs/components';
import { BufferManager, DefaultBuffers, ShaderManager } from 'toolkit/types/ecs/managers';
import { UniformType } from 'toolkit/types/webgpu/buffers';
import { ShaderBindingType } from 'toolkit/types/webgpu/shaders';
import { normalizeColour } from 'toolkit/utils/colour';

export function createBasicShader(
  {
    shaderManager,
    bufferManager,
  }: {
    shaderManager: ShaderManager;
    bufferManager: BufferManager;
  },
  material?: { entity?: number; colour?: vec3 },
): ShaderId {
  const vertexSource = `
@group(0) @binding(0)
var<uniform> model: mat4x4<f32>;

struct Matrices {
  view: mat4x4<f32>;
  projection: mat4x4<f32>;
};
@group(0) @binding(1)
var<uniform> matrices: Matrices;

@stage(vertex)
fn main(@location(0) a_pos: vec3<f32>) -> @builtin(position) vec4<f32> {
  return matrices.projection * matrices.view * model * vec4(a_pos, 1.0);
}
  `;

  const fragmentSource = `
struct UBO {
  entity_id: f32;

  colour: vec3<f32>;

  selected: f32;
  selected_colour: vec3<f32>;
}
@group(0) @binding(2)
var<uniform> u: UBO;

struct FragmentOut {
  @location(0) colour: vec4<f32>;
  @location(1) object_id: f32;
}

@stage(fragment)
fn main() -> FragmentOut {
  var out: FragmentOut;

  if (u.selected > 0.0) {
    out.colour = vec4<f32>(u.selected_colour, 1.0);
  } else {
    out.colour = vec4<f32>(u.colour, 1.0);
  }

  out.object_id = u.entity_id / 255.0;

  return out;
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
      entity_id: UniformType.Scalar,

      colour: UniformType.Vec3,

      selected: UniformType.Bool,
      selected_colour: UniformType.Vec3,
    },
    {
      entity_id: material?.entity ?? 255,

      colour: material?.colour ?? vec3.create(),

      selected: false,
      selected_colour: normalizeColour([37, 245, 10]),
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

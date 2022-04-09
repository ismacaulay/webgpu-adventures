import { mat4, vec3, vec4 } from 'gl-matrix';
import type { ShaderId } from 'toolkit/types/ecs/components';
import { BufferManager, DefaultBuffers, ShaderManager } from 'toolkit/types/ecs/managers';
import { UniformType } from 'toolkit/types/webgpu/buffers';
import { ShaderBindingType } from 'toolkit/types/webgpu/shaders';
import { normalizeColour } from 'toolkit/utils/colour';

export function createDiffuseShader(
  {
    shaderManager,
    bufferManager,
  }: {
    shaderManager: ShaderManager;
    bufferManager: BufferManager;
  },
  lights: { position: vec3; intensity: number }[],
  material?: { entity?: number; colour?: vec3; wireframe?: boolean },
): ShaderId {
  const vertexSource = `
@group(0) @binding(0)
var<uniform> model: mat4x4<f32>;

struct Matrices {
  view: mat4x4<f32>,
  projection: mat4x4<f32>,
};
@group(0) @binding(1)
var<uniform> m: Matrices;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) position_eye: vec4<f32>,
  @location(1) barycentric: vec3<f32>,
}

@stage(vertex)
fn main(
  @builtin(vertex_index) idx: u32,
  @location(0) position: vec3<f32>
) -> VertexOut {
  var out: VertexOut;
  out.position = m.projection * m.view * model * vec4<f32>(position, 1.0);
  out.position_eye = m.view * model * vec4<f32>(position, 1.0);

  var barycentric = idx % 3u;
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
  entity_id: f32,

  colour: vec3<f32>,

  selected: f32,
  selected_colour: vec3<f32>,

  wireframe: f32,

  lights: array<vec4<f32>, 5>,
  num_lights: f32,
}
@group(0) @binding(2)
var<uniform> u: UBO;

struct FragmentOut {
  @location(0) colour: vec4<f32>,
  @location(1) object_id: f32,
}

let THICKNESS = 1.0;
let WIREFRAME_COLOR = vec3<f32>(0.33, 0.33, 0.33);

@stage(fragment)
fn main(
  @location(0) position_eye: vec4<f32>,
  @location(1) barycentric: vec3<f32>
) -> FragmentOut {
  var colour = vec3<f32>(0.0);

  if (u.selected > 0.0) {
    colour = u.selected_colour;
  } else {
    colour = u.colour;
  }

  var w = 1.0;
  if (u.wireframe > 0.0) {
    var f = fwidth(barycentric);
    var a = smoothstep(vec3<f32>(0f, 0f, 0f), f * THICKNESS, barycentric);
    w = min(a.x, min(a.y, a.z));
  }

  var kd = 0.0;
  var normal = normalize(cross(dpdx(position_eye.xyz), dpdy(position_eye.xyz)));
  // TODO: need to figure out how to pass ints properly
  for (var i = 0; i < 5; i = i + 1) {
    if (bitcast<f32>(i) < u.num_lights) {
      var light = u.lights[i];
      kd = kd + light.w * max(dot(normal, normalize(light.xyz)), 0.3);
    } else {
      break;
    }
  }

  var out: FragmentOut;
  out.colour = vec4<f32>(kd * mix(WIREFRAME_COLOR, colour, w), 1.0);
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

      wireframe: UniformType.Bool,

      lights: [UniformType.Vec4, 5],
      num_lights: UniformType.Scalar,
    },
    {
      entity_id: material?.entity ?? 255,

      colour: material?.colour ?? vec3.create(),

      selected: false,
      selected_colour: normalizeColour([37, 245, 10]),

      wireframe: material?.wireframe ?? false,

      num_lights: lights.length,
      lights: lights.map((l) => {
        const { position: p, intensity: i } = l;
        return vec4.fromValues(p[0], p[1], p[2], i);
      }),
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

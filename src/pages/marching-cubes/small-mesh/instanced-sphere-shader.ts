import { mat4, vec3, vec4 } from 'gl-matrix';
import type { ShaderId } from 'toolkit/types/ecs/components';
import {
  BufferManager,
  DefaultBuffers,
  ShaderManager,
  TextureManager,
} from 'toolkit/types/ecs/managers';
import { UniformType } from 'toolkit/types/webgpu/buffers';
import { ShaderBindingType } from 'toolkit/types/webgpu/shaders';
import { convertColourMapToBuffer, VIRIDIS } from 'toolkit/utils/colour-map';

export async function createShader(
  {
    shaderManager,
    bufferManager,
    textureManager,
  }: {
    shaderManager: ShaderManager;
    bufferManager: BufferManager;
    textureManager: TextureManager;
  },
  lights: { position: vec3; intensity: number }[],
  params: { groundLevel: number },
  material?: { entity?: number; colour?: vec3 },
): Promise<ShaderId> {
  const vertexSource = `
@group(0) @binding(0)
var<uniform> model: mat4x4<f32>;

struct Matrices {
  view: mat4x4<f32>;
  projection: mat4x4<f32>;
};
@group(0) @binding(1)
var<uniform> m: Matrices;

struct VertexOut {
  @builtin(position) position: vec4<f32>;
  @location(0) position_eye: vec4<f32>;
  @location(1) noise: f32;
  @location(2) value: f32;
}

@stage(vertex)
fn main(
  @location(0) vertex_pos: vec3<f32>,
  @location(1) pos: vec3<f32>,
  @location(2) noise: f32,
  @location(3) value: f32,
) -> VertexOut {
  var position = vec4<f32>(vertex_pos + pos, 1.0);

  var out: VertexOut;
  out.position = m.projection * m.view * model * position;
  out.position_eye = m.view * model * position;
  out.noise = noise;
  out.value = value;
  return out;
}
`;

  const fragmentSource = `
struct UBO {
  entity_id: f32;

  colour: vec3<f32>;
  groundLevel: f32;

  lights: array<vec4<f32>, 5>;
  num_lights: f32;
}
@group(0) @binding(2)
var<uniform> u: UBO;

@group(0) @binding(3)
var u_sampler: sampler;
@group(0) @binding(4)
var u_texture: texture_2d<f32>;

struct FragmentOut {
  @location(0) colour: vec4<f32>;
  @location(1) object_id: f32;
}

@stage(fragment)
fn main(
  @location(0) position_eye: vec4<f32>,
  @location(1) noise: f32,
  @location(2) value: f32,
) -> FragmentOut {
  // var colour = u.colour;
  var colour = textureSample(u_texture, u_sampler, vec2<f32>(1.0-value, 0.5)).rgb;

  if (noise < u.groundLevel) {
    discard;
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
  out.colour = vec4<f32>(kd * colour, 1.0);
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

      groundLevel: UniformType.Scalar,

      lights: [UniformType.Vec4, 5],
      num_lights: UniformType.Scalar,
    },
    {
      entity_id: material?.entity ?? 255,

      colour: material?.colour ?? vec3.create(),

      groundLevel: params.groundLevel,

      num_lights: lights.length,
      lights: lights.map((l) => {
        const { position: p, intensity: i } = l;
        return vec4.fromValues(p[0], p[1], p[2], i);
      }),
    },
  );

  const sampler = textureManager.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });
  const { data: colourMap, shape } = convertColourMapToBuffer(VIRIDIS);
  const textureId = await textureManager.createTexture({
    resource: {
      buffer: colourMap,
      shape,
    },
    format: 'rgba8unorm',
  });

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
      {
        type: ShaderBindingType.Sampler,
        resource: sampler,
      },
      {
        type: ShaderBindingType.Texture,
        resource: textureId,
      },
    ],
  });
}

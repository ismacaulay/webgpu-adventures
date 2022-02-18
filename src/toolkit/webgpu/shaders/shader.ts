import type { UniformBuffer, UniformDictionary } from 'toolkit/types/webgpu/buffers';
import type {
  Shader,
  ShaderBindGroupDescriptor,
  ShaderDescriptor,
} from 'toolkit/types/webgpu/shaders';
import type { Texture } from 'toolkit/types/webgpu/textures';

function updateBuffers(buffers: UniformBuffer[], uniforms: UniformDictionary) {
  Object.entries(uniforms).forEach(([name, value]) => {
    let found = false;
    for (let i = 0; i < buffers.length; ++i) {
      const buffer = buffers[i];
      if (buffer.hasUniform(name)) {
        buffer.updateUniform(name, value);

        found = true;
        break;
      }
    }

    if (!found) {
      console.warn(`[shader] Tried to update unknown uniform: ${name}`);
    }
  });
}

export function createShader(
  id: number,
  device: GPUDevice,
  descriptor: ShaderDescriptor,
  bindings: ShaderBindGroupDescriptor[],
  buffers: UniformBuffer[],
  textures: Texture[],
): Shader {
  let vertexModule: GPUShaderModule;
  let fragmentModule: GPUShaderModule;

  if ('source' in descriptor) {
    vertexModule = device.createShaderModule({
      code: descriptor.source,
    });
    fragmentModule = vertexModule;
  } else {
    vertexModule = device.createShaderModule({
      code: descriptor.vertex.source,
    });
    fragmentModule = device.createShaderModule({
      code: descriptor.fragment.source,
    });
  }

  const vertex = {
    module: vertexModule,
    entryPoint: descriptor.vertex.entryPoint,
  };

  const fragment = {
    module: fragmentModule,
    entryPoint: descriptor.fragment.entryPoint,
  };

  return {
    id,
    vertex,
    fragment,
    bindings,
    buffers,
    textures,

    update(uniforms: UniformDictionary) {
      updateBuffers(buffers, uniforms);
    },
  };
}

export function cloneShader(
  shader: Shader,
  bindings: ShaderBindGroupDescriptor[],
  textures: Texture[],
  buffers: UniformBuffer[],
): Shader {
  const { id, vertex, fragment } = shader;

  return {
    id,
    vertex,
    fragment,
    bindings,
    buffers,
    textures,

    update(uniforms: UniformDictionary) {
      updateBuffers(buffers, uniforms);
    },
  };
}

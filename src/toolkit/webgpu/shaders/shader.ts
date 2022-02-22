import type { UniformBuffer, UniformDictionary } from 'toolkit/types/webgpu/buffers';
import {
  PostProcessingShader,
  PostProcessingShaderDescriptor,
  Shader,
  ShaderBindGroupDescriptor,
  ShaderDescriptor,
  ShaderType,
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

function buildShader({
  id,
  vertex,
  fragment,
  bindings,
  buffers,
  textures,
}: {
  id: number;
  vertex: { module: GPUShaderModule; entryPoint: string };
  fragment: { module: GPUShaderModule; entryPoint: string };
  bindings: ShaderBindGroupDescriptor[];
  buffers: UniformBuffer[];
  textures: Texture[];
}): Shader {
  let depthWrite = true;
  let depthFunc: GPUCompareFunction = 'less';

  let stencilFront: GPUStencilFaceState = {
    compare: 'always',
    failOp: 'keep',
    depthFailOp: 'keep',
    passOp: 'keep',
  };
  let stencilBack: GPUStencilFaceState = {
    compare: 'always',
    failOp: 'keep',
    depthFailOp: 'keep',
    passOp: 'keep',
  };
  let stencilWriteMask = 0xff;
  let stencilReadMask = 0xff;
  let stencilValue = 1;

  let blend: GPUBlendState = {
    alpha: {
      operation: 'add',
      srcFactor: 'src-alpha',
      dstFactor: 'one-minus-src-alpha',
    },
    color: {
      operation: 'add',
      srcFactor: 'src-alpha',
      dstFactor: 'one-minus-src-alpha',
    },
  };

  let needsUpdate = true;

  return {
    id,
    type: ShaderType.Render,
    vertex,
    fragment,
    bindings,
    buffers,
    textures,

    get needsUpdate() {
      return needsUpdate;
    },
    set needsUpdate(value: boolean) {
      needsUpdate = value;
    },

    update(uniforms: UniformDictionary) {
      updateBuffers(buffers, uniforms);
    },

    get depthWrite() {
      return depthWrite;
    },
    set depthWrite(value: boolean) {
      depthWrite = value;
    },

    get depthFunc() {
      return depthFunc;
    },
    set depthFunc(value: GPUCompareFunction) {
      depthFunc = value;
    },

    get stencilFront() {
      return stencilFront;
    },
    set stencilFront(value: GPUStencilFaceState) {
      stencilFront = value;
    },

    get stencilBack() {
      return stencilBack;
    },
    set stencilBack(value: GPUStencilFaceState) {
      stencilBack = value;
    },

    get stencilWriteMask() {
      return stencilWriteMask;
    },
    set stencilWriteMask(value: number) {
      stencilWriteMask = value;
    },

    get stencilReadMask() {
      return stencilReadMask;
    },
    set stencilReadMask(value: number) {
      stencilReadMask = value;
    },

    get stencilValue() {
      return stencilValue;
    },
    set stencilValue(value: number) {
      stencilValue = value;
    },

    get blend() {
      return blend;
    },
    set blend(value: GPUBlendState) {
      blend = value;
    },
  };
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

  if (!('vertex' in descriptor) || !('fragment' in descriptor)) {
    throw new Error('Unable to build shader: no vertex or fragment in descriptor');
  }

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

  return buildShader({ id, vertex, fragment, bindings, buffers, textures });
}

export function cloneShader(
  shader: Shader,
  bindings: ShaderBindGroupDescriptor[],
  textures: Texture[],
  buffers: UniformBuffer[],
): Shader {
  const { id, vertex, fragment } = shader;

  return buildShader({ id, vertex, fragment, bindings, buffers, textures });
}

export function createPostProcessingShader(
  id: number,
  device: GPUDevice,
  descriptor: PostProcessingShaderDescriptor,
): PostProcessingShader {
  const fragment = {
    module: device.createShaderModule({
      code: descriptor.source,
    }),
    entryPoint: descriptor.entryPoint,
  };

  let needsUpdate = true;

  return {
    id,
    type: ShaderType.PostProcessing,

    get needsUpdate() {
      return needsUpdate;
    },
    set needsUpdate(value: boolean) {
      needsUpdate = value;
    },

    fragment,
  };
}

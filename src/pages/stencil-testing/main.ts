import { PageOptions, WebGPUPage } from '../types';

import { vec3 } from 'gl-matrix';
import { createRenderer } from 'toolkit/webgpu/renderer';
import { createCamera, createFreeCameraController } from 'toolkit/camera';
import {
  createEntityManager,
  createBufferManager,
  createShaderManager,
  DefaultBuffers,
  createTextureManager,
} from 'toolkit/ecs';
import { createRenderSystem } from 'toolkit/ecs/systems';
import {
  createTransformComponent,
  createMeshGeometryComponent,
  createMaterialComponent,
} from 'toolkit/ecs/components';
import { CUBE_VERTICES_WITH_UV } from 'utils/cube-vertices';
import { BufferAttributeType, UniformBuffer, UniformType } from 'toolkit/webgpu/buffers';

import cubeVertSrc from './shader.vert';
import cubeFragSrc from './shader.frag';
import singleColorFragSrc from './singleColor.frag';
import { ShaderBindingType, ShaderBinding } from 'toolkit/webgpu/shaders';

export async function create(canvas: HTMLCanvasElement, options: PageOptions): Promise<WebGPUPage> {
  const renderer = await createRenderer(canvas);
  renderer.clearColor = [0.1, 0.1, 0.1];

  const camera = createCamera();
  vec3.set(camera.position, 0, 0, 3);
  camera.updateViewMatrix();
  const cameraController = createFreeCameraController(canvas, camera);

  const entityManager = createEntityManager();
  const bufferManager = createBufferManager(renderer.device);
  const shaderManager = await createShaderManager(renderer.device);
  const textureManager = createTextureManager(renderer.device);

  const renderSystem = createRenderSystem(
    entityManager,
    shaderManager,
    bufferManager,
    renderer,
    camera,
  );

  const depthFunc: GPUCompareFunction = 'less';

  const viewProjectionBuffer = bufferManager.get<UniformBuffer>(DefaultBuffers.ViewProjection);

  const sampler = textureManager.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'repeat',
    addressModeV: 'repeat',
  });
  const marbleTexture = await textureManager.createTexture({
    uri: '/images/marble.jpg',
    usage: GPUTextureUsage.SAMPLED,
  });
  const metalTexture = await textureManager.createTexture({
    uri: '/images/metal.png',
    usage: GPUTextureUsage.SAMPLED,
  });

  const cubeVertexBufferDescriptor = {
    array: CUBE_VERTICES_WITH_UV,
    attributes: [
      {
        type: BufferAttributeType.Float3,
        location: 0,
      },
      {
        type: BufferAttributeType.Float2,
        location: 1,
      },
    ],
  };
  const cubeVertexBufferId = bufferManager.createVertexBuffer(cubeVertexBufferDescriptor);

  const cubePositions: vec3[] = [
    [-1.0, 0.0, -1.0],
    [2.0, 0.0, 0.0],
  ];

  let shaderId = -1;
  let singleColorShaderId = -1;
  const bindings: ShaderBinding[] = [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      type: ShaderBindingType.UniformBuffer,
      resource: viewProjectionBuffer,
    },
    undefined as unknown as ShaderBinding,
    {
      binding: 2,
      visibility: GPUShaderStage.FRAGMENT,
      type: ShaderBindingType.Sampler,
      resource: textureManager.getSampler(sampler),
    },
    {
      binding: 3,
      visibility: GPUShaderStage.FRAGMENT,
      type: ShaderBindingType.SampledTexture,
      resource: textureManager.getTexture(marbleTexture).createView(),
    },
  ];
  const outlineBindings: ShaderBinding[] = [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      type: ShaderBindingType.UniformBuffer,
      resource: viewProjectionBuffer,
    },
    undefined as unknown as ShaderBinding,
  ];

  for (let i = 0; i < cubePositions.length; ++i) {
    const cubeEntity = entityManager.create();

    entityManager.addComponent(
      cubeEntity,
      createTransformComponent({
        translation: cubePositions[i],
      }),
    );
    entityManager.addComponent(
      cubeEntity,
      createMeshGeometryComponent({
        buffers: [
          {
            id: cubeVertexBufferId,
            ...cubeVertexBufferDescriptor,
          },
        ],
      }),
    );
    const modelBuffer = bufferManager.createUniformBuffer({
      model: UniformType.Mat4,
    });

    bindings[1] = {
      binding: 1,
      visibility: GPUShaderStage.VERTEX,
      type: ShaderBindingType.UniformBuffer,
      resource: bufferManager.get(modelBuffer),
    };

    if (shaderId !== -1) {
      shaderId = shaderManager.clone(shaderId, bindings);
    } else {
      shaderId = shaderManager.create({
        vertex: cubeVertSrc,
        fragment: cubeFragSrc,
        bindings,
      });
    }
    const cubeMaterialComponent = createMaterialComponent({
      shader: shaderId,
      uniforms: {},
      drawOrder: 1,
    });
    const shader = shaderManager.get(shaderId);
    shader.depthFunc = depthFunc;
    shader.stencilWriteMask = 0xff;
    shader.stencilReadMask = 0xff;
    shader.stencilValue = 1;
    shader.stencilFront = {
      compare: 'always',
      failOp: 'keep',
      depthFailOp: 'keep',
      passOp: 'replace',
    };
    shader.stencilBack = {
      compare: 'always',
      failOp: 'keep',
      depthFailOp: 'keep',
      passOp: 'replace',
    };
    entityManager.addComponent(cubeEntity, cubeMaterialComponent);

    // ----------------------------------
    // cube outline
    // ----------------------------------
    const cubeOutline = entityManager.create();
    entityManager.addComponent(
      cubeOutline,
      createTransformComponent({
        translation: cubePositions[i],
        scale: [1.1, 1.1, 1.1],
      }),
    );

    entityManager.addComponent(
      cubeOutline,
      createMeshGeometryComponent({
        buffers: [
          {
            id: cubeVertexBufferId,
            ...cubeVertexBufferDescriptor,
          },
        ],
      }),
    );

    const outlineModelBuffer = bufferManager.createUniformBuffer({
      model: UniformType.Mat4,
    });

    outlineBindings[1] = {
      binding: 1,
      visibility: GPUShaderStage.VERTEX,
      type: ShaderBindingType.UniformBuffer,
      resource: bufferManager.get(outlineModelBuffer),
    };

    if (singleColorShaderId === -1) {
      singleColorShaderId = shaderManager.create({
        vertex: cubeVertSrc,
        fragment: singleColorFragSrc,
        bindings: outlineBindings,
      });
    } else {
      singleColorShaderId = shaderManager.clone(singleColorShaderId, outlineBindings);
    }
    const outlineShader = shaderManager.get(singleColorShaderId);
    outlineShader.depthWrite = false;
    outlineShader.depthFunc = 'always';
    outlineShader.stencilValue = 1;
    outlineShader.stencilReadMask = 0xff;
    outlineShader.stencilWriteMask = 0x00;
    outlineShader.stencilFront = {
      compare: 'not-equal',
      failOp: 'keep',
      depthFailOp: 'keep',
      passOp: 'keep',
    };
    outlineShader.stencilBack = {
      compare: 'not-equal',
      failOp: 'keep',
      depthFailOp: 'keep',
      passOp: 'keep',
    };
    outlineShader.stencilWriteMask = 0xff;
    entityManager.addComponent(
      cubeOutline,
      createMaterialComponent({
        shader: singleColorShaderId,
        drawOrder: 5,
        uniforms: {},
      }),
    );
  }

  // prettier-ignore
  const planeVertices = [
        // positions       // texture Coords (note we set these higher than 1 (together with GL_REPEAT as texture wrapping mode). this will cause the loor texture to repeat)
         5.0, -0.5,  5.0,  2.0, 0.0,
        -5.0, -0.5,  5.0,  0.0, 0.0,
        -5.0, -0.5, -5.0,  0.0, 2.0,

         5.0, -0.5,  5.0,  2.0, 0.0,
        -5.0, -0.5, -5.0,  0.0, 2.0,
         5.0, -0.5, -5.0,  2.0, 2.0
    ];

  const planeEntity = entityManager.create();
  entityManager.addComponent(planeEntity, createTransformComponent({}));

  entityManager.addComponent(
    planeEntity,
    createMeshGeometryComponent({
      buffers: [
        {
          array: Float32Array.from(planeVertices),
          attributes: [
            {
              type: BufferAttributeType.Float3,
              location: 0,
            },
            {
              type: BufferAttributeType.Float2,
              location: 1,
            },
          ],
        },
      ],
    }),
  );

  const modelBuffer = bufferManager.createUniformBuffer({
    model: UniformType.Mat4,
  });
  bindings[1] = {
    binding: 1,
    visibility: GPUShaderStage.VERTEX,
    type: ShaderBindingType.UniformBuffer,
    resource: bufferManager.get(modelBuffer),
  };
  bindings[3] = {
    binding: 3,
    visibility: GPUShaderStage.FRAGMENT,
    type: ShaderBindingType.SampledTexture,
    resource: textureManager.getTexture(metalTexture).createView(),
  };

  shaderId = shaderManager.create({
    vertex: cubeVertSrc,
    fragment: cubeFragSrc,
    bindings,
  });
  const shader = shaderManager.get(shaderId);
  shader.depthWrite = true;
  shader.depthFunc = depthFunc;
  shader.stencilReadMask = 0xff;
  shader.stencilWriteMask = 0x00;
  shader.stencilValue = 1;
  shader.stencilFront = {
    compare: 'always',
    failOp: 'keep',
    depthFailOp: 'keep',
    passOp: 'keep',
  };
  shader.stencilFront = {
    compare: 'always',
    failOp: 'keep',
    depthFailOp: 'keep',
    passOp: 'keep',
  };

  entityManager.addComponent(
    planeEntity,
    createMaterialComponent({
      shader: shaderId,
      uniforms: {},
      drawOrder: 1,
    }),
  );

  let rafId = -1;
  let lastTime = performance.now();
  const { onRenderBegin = () => {}, onRenderFinish = () => {} } = options;
  function render() {
    onRenderBegin();

    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    cameraController.update(dt);

    // TODO: Dont do this every frame
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

    renderSystem.update();

    onRenderFinish();
    rafId = requestAnimationFrame(render);
  }
  render();

  return {
    destroy() {
      if (rafId > 0) {
        cancelAnimationFrame(rafId);
      }

      textureManager.destroy();
      shaderManager.destroy();
      bufferManager.destroy();
      entityManager.destroy();

      cameraController.destroy();
    },
  };
}

import { PageOptions, WebGPUPage } from '../../types';

import { vec3, mat4 } from 'gl-matrix';
import { createRenderer } from 'toolkit/webgpu/renderer';
import { createCamera, createFreeCameraController } from 'toolkit/camera';
import {
  createEntityManager,
  createBufferManager,
  createShaderManager,
  DefaultBuffers,
  createTextureManager,
} from 'toolkit/ecs';
import {
  createScriptSystem,
  createMovementSystem,
  createLightingSystem,
  createRenderSystem,
} from 'toolkit/ecs/systems';
import {
  createTransformComponent,
  createBasicMaterialComponent,
  createMeshGeometryComponent,
  createMaterialComponent,
  ComponentType,
} from 'toolkit/ecs/components';
import { getBasicShaderInfo } from 'toolkit/webgpu/shaders/basic-shader';
import { CUBE_VERTICES, CUBE_VERTICES_WITH_NORMALS_WITH_UV } from 'utils/cube-vertices';
import {
  BufferAttributeType,
  UniformBuffer,
  UniformType,
  UniformBufferDescriptor,
} from 'toolkit/webgpu/buffers';
import { Colors } from 'toolkit/materials';

import cubeVertSrc from './shader.vert';
import cubeFragSrc from './shader.frag';
import { radians } from 'toolkit/math';
import { ShaderBindingType, ShaderBinding } from 'toolkit/webgpu/shaders';

import {
  createLightManager,
  LightType,
  DirectionalLight,
  PointLight,
  SpotLight,
} from 'toolkit/ecs/light-manager';

export async function create(canvas: HTMLCanvasElement, options: PageOptions): Promise<WebGPUPage> {
  const renderer = await createRenderer(canvas);

  const camera = createCamera();
  vec3.set(camera.position, 0, 0, 3);
  camera.updateViewMatrix();
  const cameraController = createFreeCameraController(canvas, camera);

  const entityManager = createEntityManager();
  const lightManager = createLightManager();
  const bufferManager = createBufferManager(renderer.device);
  const shaderManager = await createShaderManager(renderer.device);
  const textureManager = createTextureManager(renderer.device);

  const scriptSystem = createScriptSystem(entityManager);
  const movementSystem = createMovementSystem(entityManager);
  const lightingSystem = createLightingSystem(entityManager, lightManager, shaderManager, camera);
  const renderSystem = createRenderSystem(
    entityManager,
    shaderManager,
    bufferManager,
    renderer,
    camera,
  );

  const viewProjectionBuffer = bufferManager.get<UniformBuffer>(DefaultBuffers.ViewProjection);

  // TODO: Maybe we should just be able to add lights to the
  // lighting system instead of the entity system?!

  const directionalLightDescriptor: DirectionalLight = {
    type: LightType.Directional,
    direction: vec3.fromValues(-0.2, -1.0, -0.3),
    ambient: vec3.fromValues(0.05, 0.05, 0.05),
    diffuse: vec3.fromValues(0.4, 0.4, 0.4),
    specular: vec3.fromValues(0.5, 0.5, 0.5),
  };
  lightManager.create(directionalLightDescriptor);

  const pointLightDescriptors: PointLight[] = [
    {
      type: LightType.Point,
      position: vec3.fromValues(0.7, 0.2, 2.0),
      kc: 1.0,
      kl: 0.09,
      kq: 0.032,
      ambient: vec3.fromValues(0.05, 0.05, 0.05),
      diffuse: vec3.fromValues(0.8, 0.8, 0.8),
      specular: vec3.fromValues(1.0, 1.0, 1.0),
    },
    {
      type: LightType.Point,
      position: vec3.fromValues(2.3, -3.3, -4.0),
      kc: 1.0,
      kl: 0.09,
      kq: 0.032,
      ambient: vec3.fromValues(0.05, 0.05, 0.05),
      diffuse: vec3.fromValues(0.8, 0.8, 0.8),
      specular: vec3.fromValues(1.0, 1.0, 1.0),
    },
    {
      type: LightType.Point,
      position: vec3.fromValues(-4.0, 2.0, -12.0),
      kc: 1.0,
      kl: 0.09,
      kq: 0.032,
      ambient: vec3.fromValues(0.05, 0.05, 0.05),
      diffuse: vec3.fromValues(0.8, 0.8, 0.8),
      specular: vec3.fromValues(1.0, 1.0, 1.0),
    },
    {
      type: LightType.Point,
      position: vec3.fromValues(0.0, 0.0, -3.0),
      kc: 1.0,
      kl: 0.09,
      kq: 0.032,
      ambient: vec3.fromValues(0.05, 0.05, 0.05),
      diffuse: vec3.fromValues(0.8, 0.8, 0.8),
      specular: vec3.fromValues(1.0, 1.0, 1.0),
    },
  ];

  const lightVertexBufferDescriptor = {
    array: CUBE_VERTICES,
    attributes: [
      {
        type: BufferAttributeType.Float3,
        location: 0,
      },
    ],
  };
  const lightVertexBuffer = bufferManager.createVertexBuffer(lightVertexBufferDescriptor);

  for (let i = 0; i < pointLightDescriptors.length; ++i) {
    const descriptor = pointLightDescriptors[i];
    lightManager.create(descriptor);

    // TODO: Clone this shader
    const lightShader = shaderManager.create(getBasicShaderInfo(bufferManager));
    const entity = entityManager.create();
    entityManager.addComponent(
      entity,
      createTransformComponent({
        translation: descriptor.position,
        scale: [0.1, 0.1, 0.1],
      }),
    );
    entityManager.addComponent(
      entity,
      createBasicMaterialComponent({
        shader: lightShader,
        color: Colors.White,
      }),
    );
    entityManager.addComponent(
      entity,
      createMeshGeometryComponent({
        buffers: [{ id: lightVertexBuffer, ...lightVertexBufferDescriptor }],
      }),
    );
  }

  const spotLightDescriptor = {
    type: LightType.Spot,
    position: camera.position,
    direction: camera.direction,
    inner_cutoff: Math.cos(radians(12.5)),
    outer_cutoff: Math.cos(radians(15.0)),
    kc: 1.0,
    kl: 0.09,
    kq: 0.032,
    ambient: vec3.fromValues(0.0, 0.0, 0.0),
    diffuse: vec3.fromValues(1.0, 1.0, 1.0),
    specular: vec3.fromValues(1.0, 1.0, 1.0),
  };
  const spotLight = lightManager.create(spotLightDescriptor);

  const spotLightEntity = entityManager.create();
  entityManager.addComponent(spotLightEntity, {
    type: ComponentType.Script,
    update: () => {
      const light = lightManager.get<SpotLight>(spotLight);
      light.position = camera.position;
      light.direction = camera.direction;
    },
  });

  const lightUniformsDecscriptor: UniformBufferDescriptor = {
    dir_lights: [
      {
        direction: UniformType.Vec3,
        ambient: UniformType.Vec3,
        diffuse: UniformType.Vec3,
        specular: UniformType.Vec3,
      },
      1,
    ],
    point_lights: [
      {
        position: UniformType.Vec3,
        kc: UniformType.Scalar,
        kl: UniformType.Scalar,
        kq: UniformType.Scalar,
        ambient: UniformType.Vec3,
        diffuse: UniformType.Vec3,
        specular: UniformType.Vec3,
      },
      pointLightDescriptors.length,
    ],
    spot_lights: [
      {
        position: UniformType.Vec3,
        direction: UniformType.Vec3,
        inner_cutoff: UniformType.Scalar,
        outer_cutoff: UniformType.Scalar,
        kc: UniformType.Scalar,
        kl: UniformType.Scalar,
        kq: UniformType.Scalar,
        ambient: UniformType.Vec3,
        diffuse: UniformType.Vec3,
        specular: UniformType.Vec3,
      },
      1,
    ],
  };
  const lightUniformBuffer = bufferManager.createUniformBuffer(lightUniformsDecscriptor);

  const materialUniformsDescriptor: UniformBufferDescriptor = {
    view_pos: UniformType.Vec3,
    material: {
      shininess: UniformType.Scalar,
    },
  };
  const materialBuffer = bufferManager.createUniformBuffer(materialUniformsDescriptor);

  const sampler = textureManager.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });
  const diffuseTexture = await textureManager.createTexture({
    uri: '/images/container-diffuse.png',
    usage: GPUTextureUsage.SAMPLED,
  });
  const specularTexture = await textureManager.createTexture({
    uri: '/images/container-specular.png',
    usage: GPUTextureUsage.SAMPLED,
  });

  const cubeVertexBufferDescriptor = {
    array: CUBE_VERTICES_WITH_NORMALS_WITH_UV,
    attributes: [
      {
        type: BufferAttributeType.Float3,
        location: 0,
      },
      {
        type: BufferAttributeType.Float3,
        location: 1,
      },
      {
        type: BufferAttributeType.Float2,
        location: 2,
      },
    ],
  };
  const cubeVertexBufferId = bufferManager.createVertexBuffer(cubeVertexBufferDescriptor);

  const cubePositions: vec3[] = [
    [0.0, 0.0, 0.0],
    [2.0, 5.0, -15.0],
    [-1.5, -2.2, -2.5],
    [-3.8, -2.0, -12.3],
    [2.4, -0.4, -3.5],
    [-1.7, 3.0, -7.5],
    [1.3, -2.0, -2.5],
    [1.5, 2.0, -2.5],
    [1.5, 0.2, -1.5],
    [-1.3, 1.0, -1.5],
  ];

  let cubeShader: number = -1;
  for (let i = 0; i < cubePositions.length; ++i) {
    const cubeEntity = entityManager.create();
    const angle = 20.0 * i;

    entityManager.addComponent(
      cubeEntity,
      createTransformComponent({
        translation: cubePositions[i],
        rotation: {
          angle: radians(angle),
          axis: [1.0, 0.3, 0.5],
        },
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
    const bindings: ShaderBinding[] = [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        type: ShaderBindingType.UniformBuffer,
        resource: viewProjectionBuffer,
      },
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX,
        type: ShaderBindingType.UniformBuffer,
        resource: bufferManager.get(modelBuffer),
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        type: ShaderBindingType.UniformBuffer,
        resource: bufferManager.get(materialBuffer),
      },
      {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        type: ShaderBindingType.UniformBuffer,
        resource: bufferManager.get(lightUniformBuffer),
      },
      {
        binding: 4,
        visibility: GPUShaderStage.FRAGMENT,
        type: ShaderBindingType.Sampler,
        resource: textureManager.getSampler(sampler),
      },
      {
        binding: 5,
        visibility: GPUShaderStage.FRAGMENT,
        type: ShaderBindingType.SampledTexture,
        resource: textureManager.getTexture(diffuseTexture).createView(),
      },
      {
        binding: 6,
        visibility: GPUShaderStage.FRAGMENT,
        type: ShaderBindingType.Sampler,
        resource: textureManager.getSampler(sampler),
      },
      {
        binding: 7,
        visibility: GPUShaderStage.FRAGMENT,
        type: ShaderBindingType.SampledTexture,
        resource: textureManager.getTexture(specularTexture).createView(),
      },
    ];
    if (cubeShader !== -1) {
      cubeShader = shaderManager.clone(cubeShader, bindings);
    } else {
      cubeShader = shaderManager.create({
        vertex: cubeVertSrc,
        fragment: cubeFragSrc,
        bindings,
      });
    }
    const cubeMaterialComponent = createMaterialComponent({
      shader: cubeShader,
      uniforms: {},
    });
    entityManager.addComponent(cubeEntity, cubeMaterialComponent);
  }

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

    scriptSystem.update(dt);
    movementSystem.update(dt);
    lightingSystem.update();
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
      bufferManager.destroy();
      entityManager.destroy();
      lightManager.destroy();

      cameraController.destroy();
    },
  };
}

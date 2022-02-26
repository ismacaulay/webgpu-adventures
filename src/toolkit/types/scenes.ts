import type { vec3 } from 'gl-matrix';
import type { Colour3 } from './colour';
import type { BufferManager, EntityManager, ShaderManager } from './ecs/managers';

export interface Managers {
  entityManager: EntityManager;
  bufferManager: BufferManager;
  shaderManager: ShaderManager;
}

export interface BasicObjectDescriptor {
  transform?: {
    translation?: vec3;
    rotation?: { angle: number; axis: vec3 };
    scale?: vec3;
  };
  material?: {
    wireframe?: boolean;
    colour?: Colour3;
    opacity?: number;
  };
}

export interface SphereObjectDescriptor extends BasicObjectDescriptor {
  radius?: number;
  sectors?: number;
  stacks?: number;
}

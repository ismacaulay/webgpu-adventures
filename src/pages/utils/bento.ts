import type { vec3 } from 'gl-matrix';
import type { Colour3 } from 'toolkit/types/colour';
import type { BufferManager, EntityManager, ShaderManager } from 'toolkit/types/ecs/managers';
import { generateCube } from './objects/cube';

export function generateBentoBox(
  managers: {
    entityManager: EntityManager;
    bufferManager: BufferManager;
    shaderManager: ShaderManager;
  },
  overrides?: {
    cube: {
      transform?: {
        translation?: vec3;
        rotation?: { angle: number; axis: vec3 };
        scale?: vec3;
      };
      material?: {
        colour?: Colour3;
        opacity?: number;
      };
    };
  },
) {
  const cube = generateCube(managers, overrides?.cube);

  return { cube };
}

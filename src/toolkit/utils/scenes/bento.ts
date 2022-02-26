import type { BasicObjectDescriptor, Managers, SphereObjectDescriptor } from 'toolkit/types/scenes';
import { generateCube } from './objects/cube';
import { generateSphere } from './objects/sphere';

export function generateBentoBox(
  managers: Managers,
  overrides?: {
    cube?: BasicObjectDescriptor;
    sphere?: SphereObjectDescriptor;
  },
) {
  const cube = generateCube(managers, overrides?.cube);
  const sphere = generateSphere(managers, overrides?.sphere);
  return { cube, sphere };
}

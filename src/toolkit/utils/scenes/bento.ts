import type {
  BasicObjectDescriptor,
  ConeObjectDescriptor,
  Managers,
  SphereObjectDescriptor,
} from 'toolkit/types/scenes';
import { generateCone } from './objects/cone';
import { generateCube } from './objects/cube';
import { generateSphere } from './objects/sphere';

export function generateBentoBox(
  managers: Managers,
  overrides?: {
    cube?: BasicObjectDescriptor;
    sphere?: SphereObjectDescriptor;
    cone?: ConeObjectDescriptor;
  },
) {
  const cube = generateCube(managers, overrides?.cube);
  const sphere = generateSphere(managers, overrides?.sphere);
  const cone = generateCone(managers, overrides?.cone);
  return { cube, sphere, cone };
}

import { vec3 } from 'gl-matrix';
import {
  CircularMovementComponent,
  ComponentType,
  MovementType,
} from 'toolkit/types/ecs/components';

export function createCircularMovementComponent(initial: {
  center: vec3;
  axis: vec3;
  radius: number;
  period: number;
}): CircularMovementComponent {
  const center = vec3.clone(initial.center);
  const axis = vec3.clone(initial.axis);
  let radius = initial.radius;
  let period = initial.period;

  return {
    type: ComponentType.Movement,
    subtype: MovementType.Circular,

    center,
    axis,

    get radius() {
      return radius;
    },
    set radius(value: number) {
      radius = value;
    },

    get period() {
      return period;
    },
    set period(value: number) {
      period = value;
    },
  };
}

export enum MovementType {
  Circular,
}

export interface CircularMovementComponent {
  type: ComponentType.Movement;
  subtype: MovementType.Circular;

  center: vec3;
  axis: vec3;
  radius: number;
  period: number;
}

export type MovementComponent = CircularMovementComponent;

export function createCircularMovementComponent(initial: {
  center: vec3;
  axis: vec3;
  radius: number;
  period: number;
}): CircularMovementComponent {
  const center = initial.center;
  const axis = initial.axis;
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

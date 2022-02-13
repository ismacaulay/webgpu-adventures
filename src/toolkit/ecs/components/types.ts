export enum ComponentType {
  Transform = 1,
  Geometry = 2,
  Material = 4,
  Movement = 8,
  Light = 16,
  Script = 32,
}

export interface BaseComponent {
  type: ComponentType;

  needsUpdate: boolean;
}

// TODO: This should probably be configurable based on
// the application requirements. It probably also shouldnt
// be a bit field since that will limit us to 32 (64?) components
export enum ComponentType {
  Transform = 1,
  Geometry = 2,
  Material = 4,
  Movement = 8,
  Light = 16,
  Script = 32,
}

export interface Component {
  type: ComponentType;

  [key: string]: any;
}

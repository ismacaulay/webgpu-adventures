// TODO: This should probably be configurable based on
// the application requirements. It probably also shouldnt
// be a bit field since that will limit us to 32 (64?) components
export enum ComponentType {
    Transform = 0x1,
    Geometry = 0x2,
    Material = 0x4,
    Movement = 0x8,
    Light = 0x16,
}

export interface Component {
    type: ComponentType;
}

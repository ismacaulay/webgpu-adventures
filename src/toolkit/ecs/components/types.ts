export enum ComponentType {
    Transform = 0x1,
    Geometry = 0x2,
    Material = 0x4,
}

export interface Component {
    type: ComponentType;
}

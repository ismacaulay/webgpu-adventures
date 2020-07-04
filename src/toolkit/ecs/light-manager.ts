import { vec3 } from 'gl-matrix';
import { createIdProvider } from './id-provider';

export enum LightType {
    Directional,
    Point,
    Spot,
}

interface BaseLight {
    type: LightType;

    ambient: vec3;
    diffuse: vec3;
    specular: vec3;
}

export interface DirectionalLight extends BaseLight {
    type: LightType.Directional;

    direction: vec3;
}

export interface PointLight extends BaseLight {
    type: LightType.Point;

    position: vec3;
    kc: number;
    kl: number;
    kq: number;
}

export interface SpotLight extends BaseLight {
    type: LightType.Spot;

    position: vec3;
    direction: vec3;
    inner_cutoff: number;
    outer_cutoff: number;
    kc: number;
    kl: number;
    kq: number;
}

export type Light = DirectionalLight | PointLight | SpotLight;

interface LightStorage {
    [LightType.Directional]: DirectionalLight[];
    [LightType.Point]: PointLight[];
    [LightType.Spot]: SpotLight[];
}

export interface LightManager {
    create(light: Light): number;
    // TODO: Can we type this in a way that it figures out what array type is returned?
    all(type: LightType): Light[];
    get<T extends Light>(id: number): T;

    destroy(): void;
}

export function createLightManager(): LightManager {
    const generator = createIdProvider();

    const storage: LightStorage = {
        [LightType.Directional]: [],
        [LightType.Point]: [],
        [LightType.Spot]: [],
    };
    const mapping = new Map<number, [LightType, number]>();

    return {
        create(light: Light) {
            const id = generator.next();

            mapping.set(id, [light.type, storage[light.type].length]);
            storage[light.type].push(light as any);

            return id;
        },

        all(type: LightType) {
            return storage[type];
        },

        get<T extends Light>(id: number): T {
            const descriptor = mapping.get(id);
            if (!descriptor) {
                throw new Error(`Unknown light id: ${id}`);
            }

            const [type, idx] = descriptor;
            return storage[type][idx] as T;
        },

        destroy() {
            storage[LightType.Directional] = [];
            storage[LightType.Point] = [];
            storage[LightType.Spot] = [];
            mapping.clear();
        },
    };
}

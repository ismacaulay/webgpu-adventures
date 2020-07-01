import { vec3 } from 'gl-matrix';
import { ComponentType } from './types';

export interface LightComponent {
    type: ComponentType.Light;

    ambient: vec3;
    diffuse: vec3;
    specular: vec3;
}

export function createLightComponent(initial?: {
    ambient?: vec3;
    diffuse?: vec3;
    specular?: vec3;
}): LightComponent {
    const ambient = initial?.ambient || [1.0, 1.0, 1.0];
    const diffuse = initial?.diffuse || [1.0, 1.0, 1.0];
    const specular = initial?.specular || [1.0, 1.0, 1.0];

    return {
        type: ComponentType.Light,

        ambient,
        diffuse,
        specular,
    };
}

import { vec3 } from 'gl-matrix';
import { ComponentType } from './types';

export enum LightType {
    Basic,
    Directional,
    Point,
    Spot,
}

export interface BaseLight {
    type: ComponentType.Light;
    subtype: LightType;

    ambient: vec3;
    diffuse: vec3;
    specular: vec3;
}

export interface BasicLight extends BaseLight {
    subtype: LightType.Basic;
}

export interface DirectionalLight extends BaseLight {
    subtype: LightType.Directional;

    direction: vec3;
}

export interface PointLight extends BaseLight {
    subtype: LightType.Point;

    constant: number;
    linear: number;
    quadratic: number;
}

export interface SpotLight extends BaseLight {
    subtype: LightType.Spot;

    direction: vec3;
    innerCutoff: number;
    outerCutoff: number;
}

export type LightComponent =
    | BasicLight
    | DirectionalLight
    | PointLight
    | SpotLight;

export function createLightComponent(initial: {
    ambient?: vec3;
    diffuse?: vec3;
    specular?: vec3;
}): BasicLight {
    const ambient = initial.ambient || [1.0, 1.0, 1.0];
    const diffuse = initial.diffuse || [1.0, 1.0, 1.0];
    const specular = initial.specular || [1.0, 1.0, 1.0];

    return {
        type: ComponentType.Light,
        subtype: LightType.Basic,

        ambient,
        diffuse,
        specular,
    };
}

export function createDirectionalLightComponent(initial: {
    direction: vec3;
    ambient?: vec3;
    diffuse?: vec3;
    specular?: vec3;
}): DirectionalLight {
    const ambient = initial.ambient || [1.0, 1.0, 1.0];
    const diffuse = initial.diffuse || [1.0, 1.0, 1.0];
    const specular = initial.specular || [1.0, 1.0, 1.0];

    return {
        type: ComponentType.Light,
        subtype: LightType.Directional,

        direction: initial.direction,
        ambient,
        diffuse,
        specular,
    };
}

export function createPointLightComponent(initial: {
    constant: number;
    linear: number;
    quadratic: number;
    ambient?: vec3;
    diffuse?: vec3;
    specular?: vec3;
}): PointLight {
    const ambient = initial.ambient || [1.0, 1.0, 1.0];
    const diffuse = initial.diffuse || [1.0, 1.0, 1.0];
    const specular = initial.specular || [1.0, 1.0, 1.0];

    return {
        type: ComponentType.Light,
        subtype: LightType.Point,

        constant: initial.constant,
        linear: initial.linear,
        quadratic: initial.quadratic,

        ambient,
        diffuse,
        specular,
    };
}

export function createSpotLightComponent(initial: {
    direction: vec3;
    innerCutoff: number;
    outerCutoff: number;
    ambient?: vec3;
    diffuse?: vec3;
    specular?: vec3;
}): SpotLight {
    const ambient = initial.ambient || [1.0, 1.0, 1.0];
    const diffuse = initial.diffuse || [1.0, 1.0, 1.0];
    const specular = initial.specular || [1.0, 1.0, 1.0];

    return {
        type: ComponentType.Light,
        subtype: LightType.Spot,

        direction: initial.direction,
        innerCutoff: initial.innerCutoff,
        outerCutoff: initial.outerCutoff,

        ambient,
        diffuse,
        specular,
    };
}

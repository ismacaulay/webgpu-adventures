import { vec3 } from 'gl-matrix';
import { ComponentType } from './types';

export enum LightType {
    Basic,
    Directional,
    Point,
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

    position: vec3;
}

export interface DirectionalLight extends BaseLight {
    subtype: LightType.Directional;

    direction: vec3;
}

export interface PointLight extends BaseLight {
    subtype: LightType.Point;

    position: vec3;
    constant: number;
    linear: number;
    quadratic: number;
}

export type LightComponent = BasicLight | DirectionalLight | PointLight;

export function createLightComponent(initial: {
    position: vec3;
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

        position: initial.position,
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
    position: vec3;
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

        position: initial.position,
        constant: initial.constant,
        linear: initial.linear,
        quadratic: initial.quadratic,

        ambient,
        diffuse,
        specular,
    };
}

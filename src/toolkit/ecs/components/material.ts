import { DefaultShaders } from 'toolkit/rendering/shaders';
import { Colors, Color } from 'toolkit/materials/color';
import { Component, ComponentType } from './types';

export interface MaterialComponent extends Component {
    readonly shader: number;

    readonly uniforms: any;
}

export function createBasicMaterialComponent(initial?: {
    color: Color;
}): MaterialComponent {
    const { color = Colors.Red } = initial || {};

    return {
        type: ComponentType.Material,
        shader: DefaultShaders.Basic,
        uniforms: {
            color,
        },
    };
}

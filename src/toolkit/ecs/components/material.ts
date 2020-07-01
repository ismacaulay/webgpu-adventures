import { Colors, Color } from 'toolkit/materials/color';
import { Component, ComponentType } from './types';

export interface MaterialComponent extends Component {
    readonly shader: number;

    readonly uniforms: any;
}

export function createBasicMaterialComponent(initial: {
    shader: number;
    color?: Color;
}): MaterialComponent {
    const { shader, color = Colors.Red } = initial;

    return {
        type: ComponentType.Material,
        shader,
        uniforms: {
            color,
        },
    };
}

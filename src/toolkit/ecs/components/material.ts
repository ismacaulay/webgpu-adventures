import { Colors, Color } from 'toolkit/materials/color';
import { Component, ComponentType } from './types';
import { UniformDictionary } from 'toolkit/webgpu/buffers';

export interface MaterialComponent extends Component {
    readonly shader: number;

    readonly uniforms: any;

    readonly lighting: boolean;
}

export function createBasicMaterialComponent(initial: {
    shader: number;
    color?: Color;
}): MaterialComponent {
    const { shader, color = Colors.Red } = initial;

    return {
        type: ComponentType.Material,
        shader,
        lighting: false,
        uniforms: {
            color,
        },
    };
}

export function createMaterialComponent({
    shader,
    uniforms,
}: {
    shader: number;
    uniforms: UniformDictionary;
}): MaterialComponent {
    return {
        type: ComponentType.Material,
        shader,
        lighting: true,
        uniforms,
    };
}

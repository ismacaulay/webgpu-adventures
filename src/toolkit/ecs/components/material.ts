import { Colors, Color } from 'toolkit/materials/color';
import { Component, ComponentType } from './types';
import { UniformDictionary } from 'toolkit/webgpu/buffers';

export interface MaterialComponent extends Component {
  readonly shader: number;
  readonly uniforms: UniformDictionary;

  readonly lighting: boolean;

  readonly drawOrder: number;
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
    drawOrder: Number.MAX_VALUE,
    uniforms: {
      color,
    },
  };
}

export function createMaterialComponent({
  shader,
  uniforms,
  drawOrder = Number.MAX_VALUE,
}: {
  shader: number;
  uniforms: UniformDictionary;
  drawOrder?: number;
}): MaterialComponent {
  return {
    type: ComponentType.Material,
    shader,
    lighting: true,
    uniforms,
    drawOrder,
  };
}

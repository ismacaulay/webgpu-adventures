import { BaseComponent, ComponentType } from './types';
import type { UniformDictionary } from 'toolkit/webgpu/buffers';
import { createBaseComponent } from './base';

export interface ShaderMaterialComponent extends BaseComponent {
  type: ComponentType.Material;

  readonly shader: number;
  readonly uniforms: UniformDictionary;

  // readonly lighting: boolean;

  // readonly drawOrder: number;
}

// export function createBasicMaterialComponent(initial: {
//   shader: number;
//   color?: Color;
// }): MaterialComponent {
//   const { shader, color = Colors.Red } = initial;

//   return {
//     type: ComponentType.Material,
//     shader,
//     lighting: false,
//     drawOrder: Number.MAX_VALUE,
//     uniforms: {
//       color,
//     },
//   };
// }

// export function createMaterialComponent({
//   shader,
//   uniforms,
//   drawOrder = Number.MAX_VALUE,
// }: {
//   shader: number;
//   uniforms: UniformDictionary;
//   drawOrder?: number;
// }): MaterialComponent {
//   return {
//     type: ComponentType.Material,
//     shader,
//     lighting: true,
//     uniforms,
//     drawOrder,
//   };
// }

export function createShaderMaterialComponent({
  shader,
  uniforms,
}: {
  shader: number;
  uniforms?: UniformDictionary;
}): ShaderMaterialComponent {
  return {
    type: ComponentType.Material,
    ...createBaseComponent(),

    shader,
    uniforms: uniforms || {},
  };
}

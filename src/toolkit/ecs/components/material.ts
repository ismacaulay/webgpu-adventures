import { ComponentType, ShaderMaterialComponent } from 'toolkit/types/ecs/components';
import type { UniformDictionary } from 'toolkit/types/webgpu/buffers';
import { createBaseComponent } from './base';

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
    uniforms,
  };
}

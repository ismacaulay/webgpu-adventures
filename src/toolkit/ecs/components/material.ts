import { ComponentType, ShaderMaterialComponent } from 'toolkit/types/ecs/components';
import type { UniformDictionary } from 'toolkit/types/webgpu/buffers';

export function createShaderMaterialComponent({
  shader,
  uniforms,
}: {
  shader: number;
  uniforms?: UniformDictionary;
}): ShaderMaterialComponent {
  let needsUpdate = true;

  return {
    type: ComponentType.Material,
    get needsUpdate() {
      return needsUpdate;
    },
    set needsUpdate(value: boolean) {
      needsUpdate = value;
    },
    shader,
    uniforms,
  };
}

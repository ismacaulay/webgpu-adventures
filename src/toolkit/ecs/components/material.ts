import { Colour, Colours } from 'toolkit/materials';
import {
  BasicMaterialComponent,
  ComponentType,
  ShaderMaterialComponent,
} from 'toolkit/types/ecs/components';
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

export function createBasicMaterialComponent(initial: {
  shader: number;
  colour?: Colour;
}): BasicMaterialComponent {
  const { shader, colour = Colours.Red } = initial;
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
    uniforms: {
      colour,
    },
  };
}

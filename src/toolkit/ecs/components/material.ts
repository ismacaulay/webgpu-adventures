import { Colours } from 'toolkit/materials';
import type { Colour3 } from 'toolkit/types/colour';
import {
  BasicMaterialComponent,
  ComponentType,
  ShaderMaterialComponent,
} from 'toolkit/types/ecs/components';
import type { UniformDictionary } from 'toolkit/types/webgpu/buffers';

export function createShaderMaterialComponent({
  shader,
  uniforms,
  drawOrder = Number.MAX_SAFE_INTEGER,
}: {
  shader: number;
  uniforms?: UniformDictionary;
  drawOrder?: number;
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
    drawOrder,
  };
}

export function createBasicMaterialComponent(initial: {
  shader: number;
  colour?: Colour3;
  drawOrder?: number;
}): BasicMaterialComponent {
  const { shader, colour = Colours.Red, drawOrder = Number.MAX_SAFE_INTEGER } = initial;
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
    drawOrder,
  };
}

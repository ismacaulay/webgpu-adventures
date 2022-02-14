import { vec3 } from 'gl-matrix';
import { createIdProvider } from './id-provider';

export function createLightManager(): LightManager {
  const generator = createIdProvider();

  const storage: LightStorage = {
    [LightType.Directional]: [],
    [LightType.Point]: [],
    [LightType.Spot]: [],
  };
  const mapping = new Map<number, [LightType, number]>();

  return {
    create(light: Light) {
      const id = generator.next();

      mapping.set(id, [light.type, storage[light.type].length]);
      storage[light.type].push(light as any);

      return id;
    },

    all(type: LightType) {
      return storage[type];
    },

    get<T extends Light>(id: number): T {
      const descriptor = mapping.get(id);
      if (!descriptor) {
        throw new Error(`Unknown light id: ${id}`);
      }

      const [type, idx] = descriptor;
      return storage[type][idx] as T;
    },

    destroy() {
      storage[LightType.Directional] = [];
      storage[LightType.Point] = [];
      storage[LightType.Spot] = [];
      mapping.clear();
    },
  };
}

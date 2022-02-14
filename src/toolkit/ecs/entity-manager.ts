import type { Component, ComponentType } from 'toolkit/types/ecs/components';
import type {
  ComponentFlags,
  ComponentMap,
  Entity,
  EntityManager,
} from 'toolkit/types/ecs/managers';

export function createEntityManager(): EntityManager {
  let next: Entity = 0;

  const entityComponentFlags = new Map<Entity, ComponentFlags>();
  const entityComponents = new Map<Entity, ComponentMap>();

  function buildComponentIterator(components: ComponentType[]) {
    if (!components) {
      return {
        next: function () {
          return {
            done: true,
            value: [],
          };
        },
      };
    }

    const entIter = entityComponentFlags.keys();
    return {
      next: function () {
        while (true) {
          const nextEnt = entIter.next();
          if (nextEnt.done) {
            return {
              done: true,
              value: [],
            };
          }

          let entHasAllComponents = true;
          let flags = entityComponentFlags.get(nextEnt.value) || 0x0;

          // I think this can be components & flags === components
          for (let i = 0; i < components.length; ++i) {
            if ((flags & components[i]) === 0) {
              entHasAllComponents = false;
              break;
            }
          }

          if (!entHasAllComponents) {
            continue;
          }

          const comps = entityComponents.get(nextEnt.value);
          let value: Component[] = [];
          if (comps) {
            for (let i = 0; i < components.length; ++i) {
              value.push(comps.get(components[i]) as Component);
            }
          }

          return {
            done: false,
            value: value,
          };
        }
      },
    };
  }

  return {
    create() {
      const id = next;
      next++;
      return id;
    },

    addComponent(entity: Entity, component: Component) {
      if (entity >= next) {
        throw `Invalid entity: ${entity}`;
      }

      const flags = (entityComponentFlags.get(entity) || 0x0) | component.type;
      entityComponentFlags.set(entity, flags);

      let components = entityComponents.get(entity);
      if (!components) {
        components = new Map();
        entityComponents.set(entity, components);
      }

      components.set(component.type, component);
    },

    get(id: number, components: ComponentType[]) {
      const entity = entityComponents.get(id);
      if (!entity) {
        throw `Unknown entity: ${id}`;
      }

      const result = [];
      for (let i = 0; i < components.length; ++i) {
        result.push(entity.get(components[i]) as Component);
      }

      return result;
    },

    all(components: ComponentType[]): Component[][] {
      const view = buildComponentIterator(components);

      const all = [];
      let result = view.next();
      while (!result.done) {
        all.push(result.value);
        result = view.next();
      }
      return all;
    },

    view(components: ComponentType[]): Iterator<Component[]> {
      return buildComponentIterator(components);
    },

    destroy() {
      entityComponents.clear();
      entityComponentFlags.clear();
    },
  };
}

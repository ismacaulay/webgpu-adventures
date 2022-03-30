import { noop } from 'svelte/internal';
import { ComponentType, MaterialComponent } from 'toolkit/types/ecs/components';
import type { EntityManager, ShaderManager } from 'toolkit/types/ecs/managers';
import { EventController, EventType, Unsubscriber } from 'toolkit/types/events';
import {
  SelectionEvent,
  SelectionEventHandler,
  SelectionEventType,
} from 'toolkit/types/events/selection';
import type { Renderer } from 'toolkit/types/webgpu/renderer';
import type { Shader } from 'toolkit/types/webgpu/shaders';
import { removeFromArray } from 'toolkit/utils/array';

export function createSelectionController(
  enabled: boolean,
  {
    eventController,
    entityManager,
    shaderManager,
    renderer,
  }: {
    eventController: EventController;
    entityManager: EntityManager;
    shaderManager: ShaderManager;
    renderer: Renderer;
  },
) {
  let hasMoved = false;
  let handlers: SelectionEventHandler[] = [];

  function sendEvent(e: SelectionEvent) {
    handlers.forEach((h) => h(e));
  }

  let unsub = noop;

  if (enabled) {
    unsub = eventController.register(async (e) => {
      if (e.type === EventType.PointerDown) {
        hasMoved = false;
      }

      if (e.type === EventType.PointerMove) {
        hasMoved = true;
      }

      if (e.type === EventType.PointerUp && !hasMoved) {
        hasMoved = false;

        const result = await renderer.pick(e.location);
        if (result.entity !== undefined) {
          const [material] = entityManager.get(result.entity, [ComponentType.Material]) as [
            MaterialComponent,
          ];

          const shader = shaderManager.get<Shader>(material.shader);
          shader.update({ selected: true });
          sendEvent({ type: SelectionEventType.Selected, entity: result.entity });
        } else {
          const view = entityManager.view([ComponentType.Material]);

          let viewResult = view.next();
          while (!viewResult.done) {
            const [material] = viewResult.value as [MaterialComponent];

            const shader = shaderManager.get<Shader>(material.shader);
            shader.update({ selected: false });

            viewResult = view.next();
          }
          sendEvent({ type: SelectionEventType.Cleared });
        }
      }
    });
  }

  return {
    on(handler: SelectionEventHandler): Unsubscriber {
      handlers.push(handler);

      return () => {
        removeFromArray(handlers, handler);
      };
    },

    destroy() {
      unsub();

      handlers = [];
    },
  };
}

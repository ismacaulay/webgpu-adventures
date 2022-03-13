import { EventController, EventHandler, EventType } from 'toolkit/types/events';

export function createEventController(element: HTMLElement): EventController {
  let handlers: EventHandler[] = [];

  function handlePointerDown(e: PointerEvent) {
    e.preventDefault();

    document.addEventListener('pointerup', handlePointerUp, false);
    document.addEventListener('pointermove', handlePointerMove, false);

    handlers.forEach((h) => h({ type: EventType.PointerDown, location: [e.clientX, e.clientY] }));
  }

  function handlePointerMove(e: PointerEvent) {
    e.preventDefault();

    handlers.forEach((h) => h({ type: EventType.PointerMove, location: [e.clientX, e.clientY] }));

  }

  function handlePointerUp(e: PointerEvent) {
    e.preventDefault();

    document.removeEventListener('pointerup', handlePointerUp, false);
    document.removeEventListener('pointermove', handlePointerMove, false);

    handlers.forEach((h) => h({ type: EventType.PointerUp, location: [e.clientX, e.clientY] }));
  }

  element.addEventListener('pointerdown', handlePointerDown, false);

  return {
    register(handler: EventHandler) {
      handlers.push(handler);

      return () => {
        handlers = handlers.filter((h) => h !== handler);
      };
    },

    destroy() {
      element.removeEventListener('pointerdown', handlePointerDown, false);

      handlers = [];
    },
  };
}

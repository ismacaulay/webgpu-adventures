import type { vec2 } from 'gl-matrix';

export interface TKEvent {
  type: EventType;
  location: vec2;
}

export type EventHandler = (event: TKEvent) => void;

export enum EventType {
  PointerDown,
  PointerMove,
  PointerUp,
}

export type Unsubscriber = () => void;

export interface EventController {
  register(handler: EventHandler): Unsubscriber;
  destroy(): void;
}

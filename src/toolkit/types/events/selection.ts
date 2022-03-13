import type { Unsubscriber } from '.';

export enum SelectionEventType {
  Selected = 'selected',
  Cleared = 'cleared',
}

export interface BaseSelectionEvent {
  type: SelectionEventType;
}

export interface SelectedSelectionEvent extends BaseSelectionEvent {
  type: SelectionEventType.Selected;

  entity: number;
}

export interface ClearedSelectionEvent extends BaseSelectionEvent {
  type: SelectionEventType.Cleared;
}

export type SelectionEvent = SelectedSelectionEvent | ClearedSelectionEvent;

export type SelectionEventHandler = (e: SelectionEvent) => void;

export interface SelectionController {
  on(handler: SelectionEventHandler): Unsubscriber;
}

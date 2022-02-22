import type { ShaderId } from './components';

export interface RenderSystem {
  update(): void;

  addPostProcessing(descriptor: { shader: ShaderId }): void;
  removePostProcessing(descriptor: { shader: ShaderId }): void;
}

export interface ScriptSystem {
  update(dt: number): void;
}

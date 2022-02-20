export interface RenderSystem {
  update(): void;
}

export interface ScriptSystem {
  update(dt: number): void;
}

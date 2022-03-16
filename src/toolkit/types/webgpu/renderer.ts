import type { vec2 } from 'gl-matrix';
import type { IndexBuffer, VertexBuffer } from './buffers';
import type { PostProcessingShader, Shader } from './shaders';

export interface RendererSubmission {
  shader: any;
  buffers: VertexBuffer[];
  count: number;
}

export enum RenderCommandType {
  Draw = 'draw',

  WriteBuffer = 'writeBuffer',
  CopyToTexture = 'copyToTexture',

  PostProcessing = 'postProcessing',
}

interface BaseRenderCommand {
  type: RenderCommandType;
}

export interface DrawCommand extends BaseRenderCommand {
  type: RenderCommandType.Draw;
  shader: Shader;
  indices?: IndexBuffer;
  buffers: VertexBuffer[];
  count: number;
  priority: number;
}

export interface WriteBufferCommand extends BaseRenderCommand {
  type: RenderCommandType.WriteBuffer;
  src: Float32Array | Float64Array | Uint16Array | Uint32Array;
  dst: GPUBuffer;
}

export interface CopyToTextureCommand extends BaseRenderCommand {
  type: RenderCommandType.CopyToTexture;
  src: ImageBitmap | { buffer: ArrayBuffer; shape: [number, number, number] };
  dst: GPUTexture;
}

export type BufferCommand = WriteBufferCommand | CopyToTextureCommand;
export type RenderCommand = DrawCommand;

export interface PostProcessingCommand extends BaseRenderCommand {
  type: RenderCommandType.PostProcessing;
  shader: PostProcessingShader;
}

export interface Renderer {
  readonly device: GPUDevice;

  begin(): void;
  submit(command: RenderCommand | BufferCommand | PostProcessingCommand): void;
  finish(): void;

  pick(pos: vec2): Promise<{ entity: number | undefined }>;

  destroy(): void;
}

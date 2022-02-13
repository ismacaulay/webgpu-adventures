import { BaseComponent, ComponentType } from './types';
import type { VertexBufferDescriptor, IndexBufferDescriptor } from 'toolkit/webgpu/buffers';
import { createBaseComponent } from './base';

export enum GeometryType {
  Mesh = 'mesh',
}

export interface BaseGeometryComponent extends BaseComponent {
  type: ComponentType.Geometry;
  geometryType: GeometryType;

  buffers: VertexBufferDescriptor[];
  count: number;
}

export interface MeshGeometryComponent extends BaseGeometryComponent {
  indices?: IndexBufferDescriptor;
  count: number;
}
export type GeometryComponent = MeshGeometryComponent;

export function createMeshGeometryComponent({
  indices,
  buffers,
  count,
}: {
  indices?: Uint16Array | Uint32Array;
  buffers: VertexBufferDescriptor[];
  count: number;
}): MeshGeometryComponent {
  let indexDescriptor: IndexBufferDescriptor | undefined = undefined;
  if (indices) {
    indexDescriptor = {
      array: indices,
    };
  }

  return {
    type: ComponentType.Geometry,
    geometryType: GeometryType.Mesh,
    ...createBaseComponent(),

    indices: indexDescriptor,
    buffers,

    count,
  };
}

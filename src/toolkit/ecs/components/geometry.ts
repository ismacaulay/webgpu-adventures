import { Component, ComponentType } from './types';
import { VertexBufferDescriptor } from '../buffer-manager';
import { getCountForType } from 'toolkit/webgpu/buffers/vertex-buffer';

export enum GeometryType {
  Mesh = 'mesh',
}

export interface GeometryComponent extends Component {
  type: ComponentType.Geometry;

  geometryType: GeometryType;
  buffers: VertexBufferDescriptor[];
  count: number;
}

export interface MeshGeometryComponent extends GeometryComponent {
  geometryType: GeometryType.Mesh;
}

export function createMeshGeometryComponent(initial: {
  buffers: VertexBufferDescriptor[];
}): MeshGeometryComponent {
  const { buffers } = initial;

  // TODO: Improve validation of the component
  if (buffers.length === 0) {
    throw new Error('[MeshGeometryComponent] No buffers provided');
  }

  const buffer = buffers[0];
  let valuesPerVertex = 0;
  const attrs = buffer.attributes;
  for (let i = 0; i < attrs.length; i++) {
    valuesPerVertex += getCountForType(attrs[i].type);
  }
  const count = buffer.array.length / valuesPerVertex;

  return {
    type: ComponentType.Geometry,

    geometryType: GeometryType.Mesh,
    buffers: initial.buffers,
    count,
  };
}

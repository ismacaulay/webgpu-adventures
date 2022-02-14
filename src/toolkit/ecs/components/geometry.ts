import { ComponentType, MeshGeometryComponent } from 'toolkit/types/ecs/components';
import type { IndexBufferDescriptor, VertexBufferDescriptor } from 'toolkit/types/webgpu/buffers';
import { createBaseComponent } from './base';

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
    ...createBaseComponent(),

    indices: indexDescriptor,
    buffers,

    count,
  };
}

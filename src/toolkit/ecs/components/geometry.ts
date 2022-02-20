import { ComponentType, MeshGeometryComponent } from 'toolkit/types/ecs/components';
import type { IndexBufferDescriptor, VertexBufferDescriptor } from 'toolkit/types/webgpu/buffers';

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

  let needsUpdate = true;

  return {
    type: ComponentType.Geometry,
    get needsUpdate() {
      return needsUpdate;
    },
    set needsUpdate(value: boolean) {
      needsUpdate = value;
    },

    indices: indexDescriptor,
    buffers,

    count,
  };
}

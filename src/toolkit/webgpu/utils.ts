export function webGPUSupported() {
  return navigator.gpu !== undefined;
}

export function createBuffer(
  device: GPUDevice,
  src: Float32Array | Uint16Array | Uint32Array,
  usage: number,
): GPUBuffer {
  // create a buffer
  const buffer = device.createBuffer({
    size: src.byteLength,
    usage,
    mappedAtCreation: true,
  });

  // write the data to the mapped buffer
  new (src as any).constructor(buffer.getMappedRange()).set(src);

  // unmap the buffer before submitting it to the queue
  buffer.unmap();

  return buffer;
}

export function copyBufferToBuffer(
  device: GPUDevice,
  encoder: GPUCommandEncoder,
  src: Float32Array,
  dst: GPUBuffer,
) {
  // const uploadBuffer = createBuffer(device, src, GPUBufferUsage.COPY_SRC);

  // const enc = encoder || device.createCommandEncoder();
  // enc.copyBufferToBuffer(uploadBuffer, 0, dst, 0, src.byteLength);

  // if (!encoder) {
  //   device.defaultQueue.submit([enc.finish()]);
  //   uploadBuffer.destroy();
  //   return () => {};
  // }

  return () => {
    // uploadBuffer.destroy();
  };
}

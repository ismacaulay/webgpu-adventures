export function webGPUSupported() {
    return navigator.gpu !== undefined;
}

export function requestGPU() {
    const entry: GPU | undefined = navigator.gpu;
    if (!entry) {
        throw new Error('WebGPU not supported in this browser');
    }

    return entry;
}

export function configureSwapChain(canvas: HTMLCanvasElement, descriptor: GPUSwapChainDescriptor) {
    const context: GPUCanvasContext = canvas.getContext('gpupresent') as any;
    return context.configureSwapChain(descriptor);
}

export function createBuffer(device: GPUDevice, src: Float32Array | Uint16Array, usage: number) {
    // create a buffer
    //  the simplest way is to create a mapped buffer, then write the array to the mapping
    //  you can also create a buffer, then request the mapping afterwards (not sure how to yet)
    //  finally, you can use copyBufferToBuffer to copy the data from one buffer to another
    const [buffer, mapping]: [GPUBuffer, ArrayBuffer] = device.createBufferMapped({
        size: src.byteLength,
        usage,
    });
    // write the data to the mapped buffer
    new (src as any).constructor(mapping).set(src);
    // the buffer needs to be unmapped before it can be submitted to the queue
    buffer.unmap();
    return buffer;
}

export function copyBufferToBuffer(
    device: GPUDevice,
    encoder: GPUCommandEncoder,
    src: Float32Array,
    dst: GPUBuffer,
) {
    const uploadBuffer = createBuffer(device, src, GPUBufferUsage.COPY_SRC);

    const enc = encoder || device.createCommandEncoder();
    enc.copyBufferToBuffer(uploadBuffer, 0, dst, 0, src.byteLength);

    if (!encoder) {
        device.defaultQueue.submit([enc.finish()]);
        uploadBuffer.destroy();
        return () => {};
    }

    return () => {
        uploadBuffer.destroy();
    };
}

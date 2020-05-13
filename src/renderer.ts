/// <reference path="../node_modules/@webgpu/types/dist/index.d.ts" />

export function createRenderer() {
    const entry = navigator.gpu;
    if (!entry) {
        // TODO: Should put a message on the page if it is not supported
        throw new Error('WebGPU not supported in this browser');
    }

    console.log('WebGPU supported')
}
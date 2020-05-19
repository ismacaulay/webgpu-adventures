/*
 * Source: https://github.com/austinEng/webgpu-samples/blob/master/src/glslang.ts
 */
let glslang: any = undefined;
export default async function () {
    if (glslang !== undefined) return glslang;
    const glslangModule = await import(
        // @ts-ignore
        'https://unpkg.com/@webgpu/glslang@0.0.15/dist/web-devel/glslang.js'
    );
    glslang = await glslangModule.default();
    return glslang;
}

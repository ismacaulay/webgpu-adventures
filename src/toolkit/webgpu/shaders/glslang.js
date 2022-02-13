/*
 * This loads the glslang wasm module which can be used to compile shaders into
 * SPIR-V binary format.
 *
 * Source: https://github.com/austinEng/webgpu-samples/blob/master/src/glslang.ts
 *
 * TODO: For some reason this does not build if it is a ts file. No idea why.
 */
let glslang = undefined;
export default async function () {
  if (glslang !== undefined) return glslang;

  // @ts-ignore
  const glslangModule = await import(
    /* webpackIgnore: true */
    'https://unpkg.com/@webgpu/glslang@0.0.15/dist/web-devel/glslang.js'
  );

  glslang = await glslangModule.default();
  return glslang;
}

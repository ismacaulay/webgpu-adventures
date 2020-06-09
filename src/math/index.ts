/*
A math library. 

Normally I wouldnt write my own and just use gl-matrix but that doesnt help teach me math or performance concepts.

Something to think about is if we want these to be pure functions. This may cause unnecessary GC and hinder performance.
I have noticed that three and gl-matrix do not use pure functions potentially for this reason.

A note about Matrix formatting (from gl-matrix docs)
    glMatrix is modeled after the needs of WebGL, which in turn uses matrix conventions set by OpenGL. 
    Specifically, a 4x4 matrix is an array of 16 contiguous floats with the 13th, 14th, and 15th elements 
    representing the X, Y, and Z, translation components.

    This may lead to some confusion when referencing OpenGL documentation, however, which represents 
    out all matricies in column-major format. This means that while in code a matrix may be typed out as:

    [1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 0]
    The same matrix in the OpenGL documentation is written as:

    1 0 0 x
    0 1 0 y
    0 0 1 z
    0 0 0 0
    Please rest assured, however, that they are the same thing! This is not unique to glMatrix, either, as OpenGL 
    developers have long been confused by the apparent lack of consistency between the memory layout and the documentation.
*/
import { Matrix4, Vector3 } from './types';

export function radians(degrees: number) {
    return (degrees * Math.PI) / 180.0;
}

export function normalize(v: Vector3) {
    const [x, y, z] = v;
    const lenInv = 1.0 / Math.hypot(x, y, z);
    return [x * lenInv, y * lenInv, z * lenInv];
}

export function identity() {
    // prettier-ignore
    return [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ] as Matrix4
}

export function perspective(
    fov: number,
    aspect: number,
    near: number,
    far: number,
) {
    const c = 1.0 / Math.tan(fov / 2);

    // prettier-ignore
    return [
        c / aspect, 0, 0, 0,
        0, c, 0, 0,
        0, 0, -(far + near) / (far - near), -1,
        0, 0,  -(2 * far * near) / (far - near), 0,
    ]
}

export function translate(m: Matrix4, translation: Vector3) {
    const ret = [...m] as Matrix4;
    const [x, y, z] = translation;
    ret[12] = m[0] * x + m[4] * y + m[8] * z + m[12];
    ret[13] = m[1] * x + m[5] * y + m[9] * z + m[13];
    ret[14] = m[2] * x + m[6] * y + m[10] * z + m[14];
    ret[15] = m[3] * x + m[7] * y + m[11] * z + m[15];
    return ret;
}

export function rotate(m: Matrix4, rad: number, axis: Vector3) {
    const [x, y, z] = normalize(axis);

    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const t = 1 - c;

    let b00 = c + t * x * x;
    let b01 = t * x * y - z * s;
    let b02 = t * x * z + y * s;
    let b10 = t * x * y + z * s;
    let b11 = c + t * y * y;
    let b12 = t * y * z - x * s;
    let b20 = t * x * z - y * s;
    let b21 = t * y * z + x * s;
    let b22 = c + t * z * z;

    const ret = [...m] as Matrix4;
    ret[0] = m[0] * b00 + m[4] * b01 + m[8] * b02;
    ret[1] = m[1] * b00 + m[5] * b01 + m[9] * b02;
    ret[2] = m[2] * b00 + m[6] * b01 + m[10] * b02;
    ret[3] = m[3] * b00 + m[7] * b01 + m[11] * b02;
    ret[4] = m[0] * b10 + m[4] * b11 + m[8] * b12;
    ret[5] = m[1] * b10 + m[5] * b11 + m[9] * b12;
    ret[6] = m[2] * b10 + m[6] * b11 + m[10] * b12;
    ret[7] = m[3] * b10 + m[7] * b11 + m[11] * b12;
    ret[8] = m[0] * b20 + m[4] * b21 + m[8] * b22;
    ret[9] = m[1] * b20 + m[5] * b21 + m[9] * b22;
    ret[10] = m[2] * b20 + m[6] * b21 + m[10] * b22;
    ret[11] = m[3] * b20 + m[7] * b21 + m[11] * b22;
    return ret;
}

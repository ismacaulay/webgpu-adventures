import { vec3, sub, cross, createVec3 } from './vec3';

export interface mat4 {
    readonly value: Float32Array;
    
    multiply(m: mat4): mat4;

    translate(t: vec3): mat4;
    scale(t: vec3): mat4;
    rotate(rad: number, axis: vec3): mat4;
    rotateY(rad: number): mat4;

    setTranslation(t: vec3): mat4;
    translation(): vec3;

    lookAt(eye: vec3, target: vec3, up: vec3): mat4;
}

export function createMat4(): mat4 {
    const value = new Float32Array(16);
    value[0] = 1;
    value[5] = 1;
    value[10] = 1;
    value[15] = 1;

    return {
        value,

        multiply(m: mat4): mat4 {
            const buffer = Float32Array.from(value);
            const a00 = value[0],
                a01 = value[1],
                a02 = value[2],
                a03 = value[3];
            const a10 = value[4],
                a11 = value[5],
                a12 = value[6],
                a13 = value[7];
            const a20 = value[8],
                a21 = value[9],
                a22 = value[10],
                a23 = value[11];
            const a30 = value[12],
                a31 = value[13],
                a32 = value[14],
                a33 = value[15];

            let b0 = m.value[0],
                b1 = m.value[1],
                b2 = m.value[2],
                b3 = m.value[3];
            buffer[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
            buffer[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
            buffer[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
            buffer[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

            b0 = m.value[4];
            b1 = m.value[5];
            b2 = m.value[6];
            b3 = m.value[7];
            buffer[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
            buffer[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
            buffer[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
            buffer[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

            b0 = m.value[8];
            b1 = m.value[9];
            b2 = m.value[10];
            b3 = m.value[11];
            buffer[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
            buffer[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
            buffer[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
            buffer[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

            b0 = m.value[12];
            b1 = m.value[13];
            b2 = m.value[14];
            b3 = m.value[15];
            buffer[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
            buffer[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
            buffer[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
            buffer[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

            value.set(buffer);

            return this;
        },

        translate(t: vec3) {
            const [x, y, z] = t.value;

            value[12] = value[0] * x + value[4] * y + value[8] * z + value[12];
            value[13] = value[1] * x + value[5] * y + value[9] * z + value[13];
            value[14] = value[2] * x + value[6] * y + value[10] * z + value[14];
            value[15] = value[3] * x + value[7] * y + value[11] * z + value[15];

            return this;
        },
        scale(t: vec3) {
            const [x, y, z] = t.value;

            value[0] *= x;
            value[1] *= x;
            value[2] *= x;
            value[3] *= x;

            value[4] *= y;
            value[5] *= y;
            value[6] *= y;
            value[7] *= y;

            value[8] *= z;
            value[9] *= z;
            value[10] *= z;
            value[11] *= z;

            return this;
        },

        rotate(rad: number, axis: vec3) {
            const [x, y, z] = axis.value;

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

            const buffer = Float32Array.from(value);
            buffer[0] = value[0] * b00 + value[4] * b01 + value[8] * b02;
            buffer[1] = value[1] * b00 + value[5] * b01 + value[9] * b02;
            buffer[2] = value[2] * b00 + value[6] * b01 + value[10] * b02;
            buffer[3] = value[3] * b00 + value[7] * b01 + value[11] * b02;
            buffer[4] = value[0] * b10 + value[4] * b11 + value[8] * b12;
            buffer[5] = value[1] * b10 + value[5] * b11 + value[9] * b12;
            buffer[6] = value[2] * b10 + value[6] * b11 + value[10] * b12;
            buffer[7] = value[3] * b10 + value[7] * b11 + value[11] * b12;
            buffer[8] = value[0] * b20 + value[4] * b21 + value[8] * b22;
            buffer[9] = value[1] * b20 + value[5] * b21 + value[9] * b22;
            buffer[10] = value[2] * b20 + value[6] * b21 + value[10] * b22;
            buffer[11] = value[3] * b20 + value[7] * b21 + value[11] * b22;
            value.set(buffer);

            return this;
        },
        rotateY(rad: number) {
            const c = Math.cos(rad);
            const s = Math.sin(rad);

            const buffer = Float32Array.from(value);
            buffer[0] = value[0] * c - value[8] * s;
            buffer[1] = value[1] * c - value[9] * s;
            buffer[2] = value[2] * c - value[10] * s;
            buffer[3] = value[3] * c - value[11] * s;
            buffer[8] = value[0] * s + value[8] * c;
            buffer[9] = value[1] * s + value[9] * c;
            buffer[10] = value[2] * s + value[10] * c;
            buffer[11] = value[3] * s + value[11] * c;
            value.set(buffer);

            return this;
        },

        setTranslation(t: vec3) {
            const [x, y, z] = t.value;

            value[12] = x;
            value[13] = y;
            value[14] = z;
            value[15] = 1;

            return this;
        },
        translation(): vec3 {
            return createVec3([value[12], value[13], value[14]]);
        },

        lookAt(eye: vec3, target: vec3, up: vec3) {
            const f = sub(eye, target).normalize();
            const r = cross(up, f).normalize();
            const u = cross(f, r);

            value[0] = r.value[0];
            value[1] = u.value[0];
            value[2] = f.value[0];
            value[3] = 0;

            value[4] = r.value[1];
            value[5] = u.value[1];
            value[6] = f.value[1];
            value[7] = 0;

            value[8] = r.value[2];
            value[9] = u.value[2];
            value[10] = f.value[2];
            value[11] = 0;

            value[12] = -r.dot(eye);
            value[13] = -u.dot(eye);
            value[14] = -f.dot(eye);
            value[15] = 1;

            return this;
        },
    };
}

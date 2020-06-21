import { vec3, sub, cross } from './vec3';

export interface mat4 {
    readonly value: Float32Array,
    
    translate(t: vec3): mat4;
    setTranslation(t: vec3): mat4;
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
        translate(t: vec3) {
            const [x, y, z] = t.value;

            value[12] = value[0] * x + value[4] * y + value[8] * z + value[12];
            value[13] = value[1] * x + value[5] * y + value[9] * z + value[13];
            value[14] = value[2] * x + value[6] * y + value[10] * z + value[14];
            value[15] = value[3] * x + value[7] * y + value[11] * z + value[15];

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

            value[12] = -r.dot(eye)
            value[13] = -u.dot(eye)
            value[14] = -f.dot(eye)
            value[15] = 1

            return this;
        }
    };
}

export interface vec3 {
    readonly value: [number, number, number];

    set(v: [number, number, number] | vec3): vec3;
    add(v: [number, number, number] | vec3): vec3;
    sub(v: [number, number, number] | vec3): vec3;
    multiply(v: [number, number, number] | vec3): vec3;
    scale(s: number): vec3;
    normalize(): vec3;
    dot(b: vec3): number;
}

export function createVec3(v?: vec3 | [number, number, number]): vec3 {
    const value: [number, number, number] = v
        ? Array.isArray(v)
            ? [v[0], v[1], v[2]]
            : [v.value[0], v.value[1], v.value[2]]
        : [0, 0, 0];

    return {
        value,
        set(v: [number, number, number] | vec3) {
            const [x, y, z] = Array.isArray(v) ? v : v.value;

            value[0] = x;
            value[1] = y;
            value[2] = z;

            return this;
        },
        add(v: [number, number, number] | vec3) {
            const [x, y, z] = Array.isArray(v) ? v : v.value;

            value[0] += x;
            value[1] += y;
            value[2] += z;

            return this;
        },
        sub(v: [number, number, number] | vec3) {
            const [x, y, z] = Array.isArray(v) ? v : v.value;

            value[0] -= x;
            value[1] -= y;
            value[2] -= z;

            return this;
        },
        multiply(v: [number, number, number] | vec3) {
            const [x, y, z] = Array.isArray(v) ? v : v.value;

            value[0] *= x;
            value[1] *= y;
            value[2] *= z;

            return this;
        },
        scale(s: number) {
            value[0] *= s;
            value[1] *= s;
            value[2] *= s;

            return this;
        },
        normalize() {
            const length = 1 / Math.hypot(...value);
            value[0] *= length;
            value[1] *= length;
            value[2] *= length;

            return this;
        },
        dot(b: vec3) {
            return (
                value[0] * b.value[0] +
                value[1] * b.value[1] +
                value[2] * b.value[2]
            );
        },
    };
}

export function add(a: vec3, b: vec3) {
    return createVec3(a).add(b);
}

export function sub(a: vec3, b: vec3) {
    return createVec3(a).sub(b);
}

export function dot(a: vec3, b: vec3) {
    return a.dot(b);
}

export function cross(a: vec3, b: vec3): vec3 {
    return createVec3([
        a.value[1] * b.value[2] - a.value[2] * b.value[1],
        a.value[2] * b.value[0] - a.value[0] * b.value[2],
        a.value[0] * b.value[1] - a.value[1] * b.value[0],
    ]);
}

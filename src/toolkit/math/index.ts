import { glMatrix } from 'gl-matrix';

export function radians(degrees: number) {
    return glMatrix.toRadian(degrees);
}

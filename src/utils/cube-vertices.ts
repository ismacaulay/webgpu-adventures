// prettier-ignore
const CUBE_VERTICES = Float32Array.from([
    -0.5, -0.5, -0.5, 1.0, 0.0, 0.0,
     0.5, -0.5, -0.5, 1.0, 0.0, 0.0,
     0.5,  0.5, -0.5, 1.0, 0.0, 0.0,
     0.5,  0.5, -0.5, 1.0, 0.0, 0.0,
    -0.5,  0.5, -0.5, 1.0, 0.0, 0.0,
    -0.5, -0.5, -0.5, 1.0, 0.0, 0.0,

    -0.5, -0.5,  0.5, 0.0, 1.0, 0.0,
     0.5, -0.5,  0.5, 0.0, 1.0, 0.0,
     0.5,  0.5,  0.5, 0.0, 1.0, 0.0,
     0.5,  0.5,  0.5, 0.0, 1.0, 0.0,
    -0.5,  0.5,  0.5, 0.0, 1.0, 0.0,
    -0.5, -0.5,  0.5, 0.0, 1.0, 0.0,

    -0.5,  0.5,  0.5, 0.0, 0.0, 1.0,
    -0.5,  0.5, -0.5, 0.0, 0.0, 1.0,
    -0.5, -0.5, -0.5, 0.0, 0.0, 1.0,
    -0.5, -0.5, -0.5, 0.0, 0.0, 1.0,
    -0.5, -0.5,  0.5, 0.0, 0.0, 1.0,
    -0.5,  0.5,  0.5, 0.0, 0.0, 1.0,

     0.5,  0.5,  0.5, 1.0, 1.0, 0.0,
     0.5,  0.5, -0.5, 1.0, 1.0, 0.0,
     0.5, -0.5, -0.5, 1.0, 1.0, 0.0,
     0.5, -0.5, -0.5, 1.0, 1.0, 0.0,
     0.5, -0.5,  0.5, 1.0, 1.0, 0.0,
     0.5,  0.5,  0.5, 1.0, 1.0, 0.0,

    -0.5, -0.5, -0.5, 1.0, 0.0, 1.0,
     0.5, -0.5, -0.5, 1.0, 0.0, 1.0,
     0.5, -0.5,  0.5, 1.0, 0.0, 1.0,
     0.5, -0.5,  0.5, 1.0, 0.0, 1.0,
    -0.5, -0.5,  0.5, 1.0, 0.0, 1.0,
    -0.5, -0.5, -0.5, 1.0, 0.0, 1.0,

    -0.5,  0.5, -0.5, 0.0, 1.0, 1.0,
     0.5,  0.5, -0.5, 0.0, 1.0, 1.0,
     0.5,  0.5,  0.5, 0.0, 1.0, 1.0,
     0.5,  0.5,  0.5, 0.0, 1.0, 1.0,
    -0.5,  0.5,  0.5, 0.0, 1.0, 1.0,
    -0.5,  0.5, -0.5, 0.0, 1.0, 1.0,
]);

export default CUBE_VERTICES;
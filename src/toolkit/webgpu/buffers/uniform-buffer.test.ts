/// <reference path="../../../../node_modules/@webgpu/types/dist/index.d.ts" />
import { processUniforms, createUniformBuffer } from './uniform-buffer';
import { UniformType, UniformBufferDescriptor } from './types';
import { mat4, vec3, mat2, mat3 } from 'gl-matrix';

jest.mock('../utils');

describe('uniform buffer', () => {
    const device = {} as GPUDevice;

    test('should be able to use scalar uniforms', () => {
        const descriptor = {
            a: UniformType.Scalar,
            b: UniformType.Scalar,
            c: UniformType.Scalar,
        };
        const { buffer, locations } = processUniforms(descriptor);

        expect(buffer.length).toEqual(3);
        expect(locations).toEqual({
            a: 0,
            b: 1,
            c: 2,
        });

        const uniformBuffer = createUniformBuffer(device, descriptor, {
            a: 1,
            b: 2.5,
            c: true,
        });
        expect(uniformBuffer.data).toEqual(Float32Array.from([1, 2.5, 1]));
    });

    test('should be able to use vec2 uniforms', () => {
        const descriptor = {
            a: UniformType.Vec2,
            b: UniformType.Vec2,
            c: UniformType.Vec2,
        };
        const { buffer, locations } = processUniforms(descriptor);

        expect(buffer.length).toEqual(6);
        expect(locations).toEqual({
            a: 0,
            b: 2,
            c: 4,
        });

        const uniformBuffer = createUniformBuffer(device, descriptor, {
            a: [1, 2],
            b: [2, 3],
            c: [3, 4],
        });
        expect(uniformBuffer.data).toEqual(Float32Array.from([1, 2, 2, 3, 3, 4]));
    });

    test('should be able to use vec3 uniforms', () => {
        const descriptor = {
            a: UniformType.Vec3,
            b: UniformType.Vec3,
            c: UniformType.Vec3,
        };
        const { buffer, locations } = processUniforms(descriptor);

        expect(buffer.length).toEqual(11);
        expect(locations).toEqual({
            a: 0,
            b: 4,
            c: 8,
        });

        const uniformBuffer = createUniformBuffer(device, descriptor, {
            a: [1, 2, 3],
            b: [2, 3, 4],
            c: [3, 4, 5],
        });
        expect(uniformBuffer.data).toEqual(Float32Array.from([1, 2, 3, 0, 2, 3, 4, 0, 3, 4, 5]));
    });

    test('should be able to use vec4 uniforms', () => {
        const descriptor = {
            a: UniformType.Vec4,
            b: UniformType.Vec4,
            c: UniformType.Vec4,
        };
        const { buffer, locations } = processUniforms(descriptor);

        expect(buffer.length).toEqual(12);
        expect(locations).toEqual({
            a: 0,
            b: 4,
            c: 8,
        });
        const uniformBuffer = createUniformBuffer(device, descriptor, {
            a: [1, 2, 3, 4],
            b: [2, 3, 4, 5],
            c: [3, 4, 5, 6],
        });
        expect(uniformBuffer.data).toEqual(Float32Array.from([1, 2, 3, 4, 2, 3, 4, 5, 3, 4, 5, 6]));
    });

    test('should be able to use mat2 uniforms', () => {
        const descriptor = {
            a: UniformType.Mat2,
            b: UniformType.Mat2,
        };
        const { buffer, locations } = processUniforms(descriptor);

        expect(buffer.length).toEqual(16);
        expect(locations).toEqual({
            a: { offset: 0, c: 2, r: 2 },
            b: { offset: 8, c: 2, r: 2 },
        });
        const uniformBuffer = createUniformBuffer(device, descriptor, {
            a: mat2.create(),
            b: mat2.fromValues(0, 1, 0, 1),
        });

        // prettier-ignore
        expect(uniformBuffer.data).toEqual(Float32Array.from([
            // a
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 1, 0, 0,
            0, 1, 0, 0,
        ]));
    });

    test('should be able to use mat3 uniforms', () => {
        const descriptor = {
            a: UniformType.Mat3,
            b: UniformType.Mat3,
        };
        const { buffer, locations } = processUniforms(descriptor);

        expect(buffer.length).toEqual(24);
        expect(locations).toEqual({
            a: { offset: 0, c: 3, r: 3 },
            b: { offset: 12, c: 3, r: 3 },
        });
        const uniformBuffer = createUniformBuffer(device, descriptor, {
            a: mat3.create(),
            b: mat3.fromValues(0, 1, 0, 1, 0, 1, 1, 1, 1),
        });

        // prettier-ignore
        expect(uniformBuffer.data).toEqual(Float32Array.from([
            // a
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            // b
            0, 1, 0, 0,
            1, 0, 1, 0,
            1, 1, 1, 0,
        ]));
    });

    test('should be able to use mat4 uniforms', () => {
        const descriptor = {
            a: UniformType.Mat4,
            b: UniformType.Mat4,
        };
        const { buffer, locations } = processUniforms(descriptor);

        expect(buffer.length).toEqual(32);
        expect(locations).toEqual({
            a: { offset: 0, c: 4, r: 4 },
            b: { offset: 16, c: 4, r: 4 },
        });
        const uniformBuffer = createUniformBuffer(device, descriptor, {
            a: mat4.create(),
            b: mat4.fromTranslation(mat4.create(), vec3.fromValues(-1, -2, -3)),
        });

        // prettier-ignore
        expect(uniformBuffer.data).toEqual(Float32Array.from([
            // a
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
            // b
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -1, -2, -3, 1,
        ]));
    });

    test('should be able to use struct uniforms', () => {
        const descriptor = {
            a: {
                b: UniformType.Scalar,
                c: UniformType.Scalar,
                d: UniformType.Scalar,
            },
        };

        const { locations } = processUniforms(descriptor);
        const uniformBuffer = createUniformBuffer(device, descriptor, {
            a: {
                b: 1,
                c: 2,
                d: 3,
            },
        });
        //prettier-ignore
        expect(uniformBuffer.data).toEqual(Float32Array.from([
            1,
            2,
            3,
            0
        ]));
        expect(locations).toEqual({
            a: true,
            'a.b': 0,
            'a.c': 1,
            'a.d': 2,
        });
    });

    // See examples in: https://www.khronos.org/registry/OpenGL/extensions/ARB/ARB_uniform_buffer_object.txt
    test('should pass std140 example layout', () => {
        const descriptor: UniformBufferDescriptor = {
            a: UniformType.Scalar,
            b: UniformType.Vec2,
            c: UniformType.Vec3,
            f: {
                d: UniformType.Scalar,
                e: UniformType.Vec2,
            },
            g: UniformType.Scalar,
            h: [UniformType.Scalar, 2],
            i: UniformType.Mat2x3,
            o: [
                {
                    j: UniformType.Vec3,
                    k: UniformType.Vec2,
                    l: [UniformType.Scalar, 2],
                    m: UniformType.Vec2,
                    n: [UniformType.Mat3, 2],
                },
                2,
            ],
        };
        const { locations } = processUniforms(descriptor);

        const uniformBuffer = createUniformBuffer(device, descriptor, {
            a: 1,
            b: [2, 3],
            c: [4, 5, 6],
            f: {
                d: 7,
                // TODO: support boolean vectors
                // e: [true, false]
                e: [7.1, 7.2],
            },
            g: 8,
            h: [9, 10],
            // prettier-ignore
            i: [11, 13, 15,
                12, 14, 16],
            o: [
                {
                    j: [17, 18, 19],
                    k: [20, 21],
                    l: [22, 23],
                    m: [24, 25],
                    n: [
                        mat3.fromValues(26, 27, 28, 29, 30, 31, 32, 33, 34),
                        mat3.fromValues(35, 36, 37, 38, 39, 40, 41, 42, 43),
                    ],
                },
                {
                    j: [44, 45, 46],
                    k: [47, 48],
                    l: [49, 50],
                    m: [51, 52],
                    n: [
                        mat3.fromValues(53, 54, 55, 56, 57, 58, 59, 60, 61),
                        mat3.fromValues(62, 63, 64, 65, 66, 67, 68, 69, 70),
                    ],
                },
            ],
        });

        expect(uniformBuffer.data).toEqual(
            // prettier-ignore
            Float32Array.from([
                    1,              // 0..3, a
                    0,              // 3..7, padding
                    2, 3,           // 7..15, b
                    4, 5, 6,        // 16..27, c
                    0,              // 28..31, padding
                    7,              // 32..35, f.d
                    0,              // 36..40, padding
                    7.1, 7.2,       // 40..47, f.e
                    8,              // 48..51, g
                    0, 0, 0,        // 52..63, padding
                    9,              // 64..67, h[0]
                    0, 0, 0,        // 68..79, padding
                    10,             // 80..83, h[1]
                    0, 0, 0,        // 84..95, padding
                    11, 13, 15,     // 96..107, i (column 0)
                    0,              // 108..111, padding
                    12, 14, 16,     // 112..123, i (column 1)
                    0,              // 124..127, padding
                    17, 18, 19,     // 128..139, o[0].j
                    0,              // 140..143, padding
                    20, 21,         // 144..151, o[0].k
                    0, 0,           // 152..159, padding
                    22,             // 160..163, o[0].l[0]
                    0, 0, 0,        // 164..175, padding
                    23,             // 176..179, o[0].l[1]
                    0, 0, 0,        // 180..191, padding
                    24, 25,         // 192..199, o[0].m
                    0, 0,           // 200..207, padding
                    26, 27, 28,     // 208..219, o[0].n[0] (column 0)
                    0,              // 220..223, padding
                    29, 30, 31,     // 224..235, o[0].n[0] (column 1)
                    0,              // 236..239, padding
                    32, 33, 34,     // 240..251, o[0].n[0] (column 2)
                    0,              // 252..255, padding
                    35, 36, 37,     // 256..267, o[0].n[1] (column 0)
                    0,              // 268..271, padding
                    38, 39, 40,     // 272..283, o[0].n[1] (column 1)
                    0,              // 284..287, padding
                    41, 42, 43,     // 288..299, o[0].n[1] (column 2)
                    0,              // 300..303, padding
                    44, 45, 46,     // 304..315, o[1].j
                    0,              // 316..319, padding
                    47, 48,         // 320..327, o[1].k
                    0, 0,           // 328..335, padding
                    49,             // 336..339, o[1].l[0]
                    0, 0, 0,        // 340..351, padding
                    50,             // 352..355, o[1].l[1]
                    0, 0, 0,        // 356..367, padding
                    51, 52,         // 368..375, o[1].m
                    0, 0,           // 376..383, padding
                    53, 54, 55,     // 384..395, o[1].n[0] (column 0)
                    0,              // 396..399, padding
                    56, 57, 58,     // 400..411, o[1].n[0] (column 1)
                    0,              // 412..415, padding
                    59, 60, 61,     // 416..427, o[1].n[0] (column 2)
                    0,              // 428..431, padding
                    62, 63, 64,     // 432..443, o[1].n[1] (column 0)
                    0,              // 444..447, padding
                    65, 66, 67,     // 448..459, o[1].n[1] (column 1)
                    0,              // 460..463, padding
                    68, 69, 70,     // 464..475, o[1].n[1] (column 2)
                    0,              // 476..479, padding
                ]),
        );

        expect(locations).toEqual({
            a: 0,
            b: 2,
            c: 4,
            f: true,
            'f.d': 8,
            'f.e': 10,
            g: 12,
            h: true,
            'h[0]': 16,
            'h[1]': 20,
            i: { offset: 24, c: 2, r: 3 },
            o: true,
            'o[0]': true,
            'o[0].j': 32,
            'o[0].k': 36,
            'o[0].l': true,
            'o[0].l[0]': 40,
            'o[0].l[1]': 44,
            'o[0].m': 48,
            'o[0].n': true,
            'o[0].n[0]': { offset: 52, c: 3, r: 3 },
            'o[0].n[1]': { offset: 64, c: 3, r: 3 },
            'o[1]': true,
            'o[1].j': 76,
            'o[1].k': 80,
            'o[1].l': true,
            'o[1].l[0]': 84,
            'o[1].l[1]': 88,
            'o[1].m': 92,
            'o[1].n': true,
            'o[1].n[0]': { offset: 96, c: 3, r: 3 },
            'o[1].n[1]': { offset: 108, c: 3, r: 3 },
        });
    });
});

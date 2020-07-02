import { processUniforms } from './uniform-buffer';

describe('uniform buffer', () => {
    test('should be able to use scalar uniforms', () => {
        const { buffer, locations } = processUniforms({
            a: 1,
            b: 2.5,
            c: true,
        });

        expect(buffer).toEqual(Float32Array.from([1, 2.5, 1]));
        expect(locations).toEqual({
            a: 0,
            b: 1,
            c: 2,
        });
    });

    test('should be able to use vec2 uniforms', () => {
        const { buffer, locations } = processUniforms({
            a: [1, 2],
            b: [2, 3],
            c: [3, 4],
        });

        expect(buffer).toEqual(Float32Array.from([1, 2, 2, 3, 3, 4]));
        expect(locations).toEqual({
            a: 0,
            b: 2,
            c: 4,
        });
    });

    test('should be able to use vec3 uniforms', () => {
        const { buffer, locations } = processUniforms({
            a: [1, 2, 3],
            b: [2, 3, 4],
            c: [3, 4, 5],
        });

        expect(buffer).toEqual(
            Float32Array.from([1, 2, 3, 0, 2, 3, 4, 0, 3, 4, 5]),
        );
        expect(locations).toEqual({
            a: 0,
            b: 4,
            c: 8,
        });
    });

    test('should be able to use vec4 uniforms', () => {
        const { buffer, locations } = processUniforms({
            a: [1, 2, 3, 4],
            b: [2, 3, 4, 5],
            c: [3, 4, 5, 6],
        });

        expect(buffer).toEqual(
            Float32Array.from([1, 2, 3, 4, 2, 3, 4, 5, 3, 4, 5, 6]),
        );
        expect(locations).toEqual({
            a: 0,
            b: 4,
            c: 8,
        });
    });

    test('should be able to mix vec2 and scalar uniforms', () => {
        const { buffer, locations } = processUniforms({
            a: 1,
            b: [2, 3],
            c: 4,
        });

        expect(buffer).toEqual(Float32Array.from([1, 0, 2, 3, 4]));
        expect(locations).toEqual({
            a: 0,
            b: 2,
            c: 4,
        });
    });

    test('should be able to mix vec3 and scalar uniforms', () => {
        const { buffer, locations } = processUniforms({
            a: 1,
            b: [2, 3, 4],
            c: 5,
        });

        expect(buffer).toEqual(Float32Array.from([1, 0, 0, 0, 2, 3, 4, 5]));
        expect(locations).toEqual({
            a: 0,
            b: 4,
            c: 7,
        });
    });

    test('should be able to use struct uniforms', () => {
        const { buffer, locations } = processUniforms({
            a: {
                b: 1,
                c: 2,
                d: 3,
            },
        });

        expect(buffer).toEqual(Float32Array.from([1, 2, 3, 0]));
        expect(locations).toEqual({
            'a.b': 0,
            'a.c': 1,
            'a.d': 2,
        });
    });

    // See examples in: https://www.khronos.org/registry/OpenGL/extensions/ARB/ARB_uniform_buffer_object.txt
    test('should pass std140 example layout', () => {
        const { buffer, locations } = processUniforms({
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
        });

        expect(buffer).toEqual(
            // prettier-ignore
            Float32Array.from([
                1, 
                0, // padding
                2, 3, 
                4, 5, 6, 
                0, // padding
                7,
                0, // padding
                7.1, 7.2,
                8
            ]),
        );
        expect(locations).toEqual({
            a: 0,
            b: 2,
            c: 4,
            'f.d': 8,
            'f.e': 10,
            g: 12,
        });
    });
});

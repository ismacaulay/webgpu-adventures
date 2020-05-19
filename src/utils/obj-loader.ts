/*
 *   A WIP obj loader based on OBJLoader from threejs
 *
 *   https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/OBJLoader.js
 */
function process(text: string) {
    if (text.indexOf('\r\n') !== -1) {
        // This is faster than String.split with regex that splits on both
        text = text.replace(/\r\n/g, '\n');
    }

    if (text.indexOf('\\\n') !== -1) {
        // join lines separated by a line continuation character (\)
        text = text.replace(/\\\n/g, '');
    }

    const lines = text.split('\n');

    let line, firstChar;
    let vertices = [],
        faces = [];
    for (let i = 0; i < lines.length; i++) {
        line = lines[i].trimLeft();
        if (line.length === 0) continue;

        firstChar = line.charAt(0);
        if (firstChar === '#') continue;

        const data = line.split(/\s+/);
        if (firstChar === 'v') {
            vertices.push(
                parseFloat(data[1]),
                parseFloat(data[2]),
                parseFloat(data[3]),
            );
        } else if (firstChar === 'f') {
            faces.push(
                parseInt(data[1], 10),
                parseInt(data[2], 10),
                parseInt(data[3], 10),
            );
        }
    }

    return {
        vertices: Float32Array.from(vertices),
        faces: Uint32Array.from(faces),
    };
}

export async function load(url: string) {
    return fetch(url).then(async resp => {
        return resp.text().then(data => {
            return process(data);
        });
    });
}

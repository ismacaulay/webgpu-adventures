import {flattenVertices} from "toolkit/utils/geometry";

// https://www.songho.ca/opengl/gl_sphere.html
export function generateSphereMesh(radius: number, sectors: number, stacks: number) {
  const vertices: number[] = [];

  const sectorStep = (2 * Math.PI) / sectors;
  const stackStep = Math.PI / stacks;

  let stackAngle: number;
  let sectorAngle: number;
  let x: number;
  let y: number;
  let z: number;
  let xz: number;
  for (let i = 0; i <= stacks; ++i) {
    stackAngle = Math.PI / 2 - i * stackStep;
    xz = radius * Math.cos(stackAngle);
    y = radius * Math.sin(stackAngle);

    for (let j = 0; j <= sectors; ++j) {
      sectorAngle = j * sectorStep;

      x = xz * Math.cos(sectorAngle);
      z = xz * Math.sin(sectorAngle);

      vertices.push(x, y, z);
    }
  }

  const indices: number[] = [];
  let k1: number;
  let k2: number;
  for (let i = 0; i < stacks; ++i) {
    k1 = i * (sectors + 1);
    k2 = k1 + sectors + 1;
    for (let j = 0; j < sectors; ++j, ++k1, ++k2) {
      if (i !== 0) {
        indices.push(k1, k2, k1 + 1);
      }

      if (i !== stacks - 1) {
        indices.push(k1 + 1, k2, k2 + 1);
      }
    }
  }

  return { vertices: flattenVertices(indices, vertices) };
}

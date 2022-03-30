export function flattenVertices(indices: ArrayLike<number>, vertices: ArrayLike<number>) {
  const out = new Float32Array(indices.length * 3);
  let idx = 0;
  for (let i = 0; i < indices.length; ++i) {
    idx = indices[i];
    out[i * 3 + 0] = vertices[idx * 3 + 0];
    out[i * 3 + 1] = vertices[idx * 3 + 1];
    out[i * 3 + 2] = vertices[idx * 3 + 2];
  }

  return out;
}

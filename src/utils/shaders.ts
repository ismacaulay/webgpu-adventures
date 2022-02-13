export async function loadShader(url: string) {
  return fetch(url, { mode: 'cors' }).then((res) =>
    res.arrayBuffer().then((arr) => new Uint32Array(arr)),
  );
}

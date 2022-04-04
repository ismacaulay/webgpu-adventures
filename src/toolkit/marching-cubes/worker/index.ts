import type { vec3 } from 'gl-matrix';
import { pointInBox } from 'toolkit/math/point';
import { createNoise3DDensityFn } from '../density';
import { createMarchingCubes } from '../march';

// TODO: move these types
interface ChunkMessage {
  chunk: vec3;
  numChunks: vec3;
  chunkSize: vec3;
  pointSpacing: number;
  noise: {
    seed: number;
    scale: number;
    octaves: number;
    persistence: number;
    lacunarity: number;
    offset: { x: number; y: number; z: number };
  };
  box: { min: vec3; max: vec3 };
}

interface WorkerMessage {
  workerId: number;
  msg: ChunkMessage;
}

function handleChunkMessage(msg: ChunkMessage) {
  const { chunk, chunkSize, pointSpacing, noise, box } = msg;

  const isoLevel = 0;

  const noiseDesnityFn = createNoise3DDensityFn(noise);

  const densityFn = function densityFn(idx: vec3) {
    if (pointInBox(idx, box.min, box.max)) {
      return noiseDesnityFn(idx);
    }
    return isoLevel - 1;
  };

  const offset: vec3 = [chunk[0] * chunkSize[0], chunk[1] * chunkSize[1], chunk[2] * chunkSize[2]];

  // console.log('starting chunk: ', chunk, offset, box);

  const marchingCubes = createMarchingCubes({
    size: chunkSize,
    offset,
    spacing: pointSpacing,
    densityFn,
    isoLevel,
  });

  const { vertices } = marchingCubes.march();
  // console.log('done chunk: ', chunk);
  return { chunk, vertices };
}

onmessage = function onmessage(ev: MessageEvent<WorkerMessage>) {
  const {
    data: { workerId, msg },
  } = ev;

  const result = handleChunkMessage(msg);
  const buffers = [result.vertices.buffer];

  // we know this is a worker, so cast it to one so that the type definition is correct
  (this as unknown as Worker).postMessage({ workerId, result }, buffers);
};

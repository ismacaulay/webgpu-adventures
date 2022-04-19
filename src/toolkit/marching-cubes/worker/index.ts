import type { vec3 } from 'gl-matrix';
import { pointInBox } from 'toolkit/math/point';
import {
  createEllipsoidDensityFn,
  createNoise3DDensityFn,
  createSphereDensityFn,
  DensityFn,
} from '../density';
import { createMarchingCubes } from '../march';

interface WorkerMessage {
  workerId: number;
  msg: any;
}

function handleChunkMessage(msg: any) {
  const { chunk, chunkSize, pointSpacing, isoLevel } = msg;

  let densityFn: DensityFn;

  if (msg.densityFn === 'noise') {
    const noiseDesnityFn = createNoise3DDensityFn(msg.noise);
    const box = msg.box;
    densityFn = function densityFn(idx: vec3) {
      if (pointInBox(idx, box.min, box.max)) {
        return noiseDesnityFn(idx);
      }
      return isoLevel - 1;
    };
  } else if (msg.densityFn === 'sphere') {
    densityFn = createSphereDensityFn({ ...msg.sphere, centre: [20, 20, 20] });
  } else if (msg.densityFn === 'ellipse') {
    densityFn = createEllipsoidDensityFn({ ...msg.ellipse, centre: [20, 20, 20] });
  } else {
    throw new Error(`Unknown densityFn: ${msg.densityFn}`);
  }

  const offset: vec3 = [chunk[0] * chunkSize[0], chunk[1] * chunkSize[1], chunk[2] * chunkSize[2]];

  const marchingCubes = createMarchingCubes({
    size: chunkSize,
    offset,
    spacing: pointSpacing,
    densityFn,
    isoLevel,
  });

  const { vertices } = marchingCubes.march();
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

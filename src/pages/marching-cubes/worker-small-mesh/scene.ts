import type {
  BufferManager,
  EntityManager,
  ShaderManager,
  TextureManager,
} from 'toolkit/types/ecs/managers';
import { createWorkerPool } from 'toolkit/workers/pool';

export async function buildScene({
  entityManager,
  bufferManager,
  shaderManager,
  textureManager,
}: {
  entityManager: EntityManager;
  bufferManager: BufferManager;
  shaderManager: ShaderManager;
  textureManager: TextureManager;
}) {
  const script = '/build/workers/marching-cubes.worker.js';

  const pool = createWorkerPool(script);

  // const worker = new Worker('/build/workers/marching-cubes.worker.js');
  // worker.onmessage = (ev: MessageEvent) => {
  //   console.log('main', ev);
  // };

  // worker.postMessage({});
  const message = {};

  const results = await Promise.all([
    pool.enqueue(message),
    pool.enqueue(message),
    pool.enqueue(message),
    pool.enqueue(message),
    pool.enqueue(message),
    pool.enqueue(message),
    pool.enqueue(message),
  ]);
  console.log(results);

  pool.destroy();
}

/* eslint-disable @typescript-eslint/no-explicit-any */

interface WorkerEntry {
  id: number;
  worker: Worker;
  busy: boolean;
  onResult: any;
}

interface QueueEntry {
  message: any;
  onResult: any;
}

interface WorkerResult {
  workerId: number;
  result: any;
}

export function createWorkerPool(url: string, opts?: { maxWorkers?: number }) {
  const maxWorkers = opts?.maxWorkers ?? 1;

  let workers: WorkerEntry[] = [];
  let queue: QueueEntry[] = [];

  function handleMessage(ev: MessageEvent<WorkerResult>) {
    const { data } = ev;

    const worker = workers[data.workerId];
    if (worker) {
      worker.onResult(data.result);
      worker.busy = false;
    }

    // the worker freed up so go handle another message
    process();
  }

  function getAvailableWorker() {
    let worker = workers.find((w) => {
      return !w.busy;
    });

    if (!worker && workers.length < maxWorkers) {
      worker = {
        id: workers.length,
        busy: false,
        worker: new Worker(url),
        onResult: undefined,
      };
      worker.worker.onmessage = handleMessage;
      workers.push(worker);
    }

    return worker;
  }

  function process() {
    // if there are no messages in the queue, there is no work to do
    if (queue.length === 0) {
      return;
    }

    // get a worker, if there are non available then we cant do any work
    const worker = getAvailableWorker();
    if (!worker) {
      return;
    }

    const [entry] = queue.splice(0, 1);
    worker.busy = true;
    worker.onResult = entry.onResult;
    worker.worker.postMessage({ workerId: worker.id, msg: entry.message });
  }

  return {
    enqueue(msg: any) {
      return new Promise((res) => {
        const entry = {
          message: msg,
          onResult: function onResult(result: any) {
            res(result);
          },
        };
        queue.push(entry);
        process();
      });
    },

    destroy() {
      queue = [];

      workers.forEach((e) => e.worker.terminate());
      workers = [];
    },
  };
}

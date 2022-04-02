export function foo() {
  return 42;
}

onmessage = function onmessage(ev: MessageEvent) {
  const { data } = ev;
  console.log('worker got message', data);

  this.setTimeout(() => {
    console.log('sending result', data.workerId);
    this.postMessage({ workerId: data.workerId, result: foo() });
  }, 1000);
};

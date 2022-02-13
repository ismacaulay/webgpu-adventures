export function createIdProvider(start = 0) {
  let next = start;

  return {
    next() {
      const id = next;
      next++;
      return id;
    },
  };
}

export function removeFromArray<T>(arr: Array<T>, item: T) {
  const idx = arr.findIndex((v) => v === item);
  if (idx !== -1) {
    arr.splice(idx, 1);
  }
}

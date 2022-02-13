function createNeedsUpdate(initial = true) {
  let needsUpdate = initial;
  return {
    get needsUpdate() {
      return needsUpdate;
    },
    set needsUpdate(value: boolean) {
      needsUpdate = value;
    },
  };
}

export function createBaseComponent() {
  return {
    ...createNeedsUpdate(),
  };
}


export function createState<T>(initial: T) {

  let needsUpdate = false;

  let state = initial;

  return {
    get needsUpdate() {
      return needsUpdate;
    },
    set needsUpdate(value: boolean) {
      needsUpdate = value;
    },

    get value() {
      return state;
    },
    set value(value: T) {
      state = value;
    }
  }
}

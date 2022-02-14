export interface GenericObject<T> {
  [key: string]: T;
}

export interface Storage<T> {
  [key: number]: T;
}

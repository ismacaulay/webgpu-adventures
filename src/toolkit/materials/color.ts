import type { GenericObject } from 'toolkit/types/generic';

export type Colour = [number, number, number];

export const Colours: GenericObject<Colour> = {
  Red: [1.0, 0.0, 0.0],
  White: [1.0, 1.0, 1.0],
};

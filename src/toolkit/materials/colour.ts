import type { Colour3 } from 'toolkit/types/colour';
import type { GenericObject } from 'toolkit/types/generic';

export const Colours: GenericObject<Colour3> = {
  Red: [1.0, 0.0, 0.0],
  White: [1.0, 1.0, 1.0],
};

export function normalizeColour(c: Colour3): Colour3 {
  return c.map((v) => v / 255.0) as Colour3;
}

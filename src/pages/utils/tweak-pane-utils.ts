import { normalizeColour } from 'toolkit/materials';
import type { Colour3 } from 'toolkit/types/colour';

export function fromTpColour(v: { r: number; g: number; b: number }): Colour3 {
  return normalizeColour([v.r, v.g, v.b]);
}

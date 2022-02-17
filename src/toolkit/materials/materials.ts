import type { GenericObject } from 'toolkit/types/generic';

export enum Materials {
  Default = 'default',
  Emerald = 'emerald',
  Pearl = 'pearl',
  Gold = 'gold',
  CyanPlastic = 'cyan_plastic',
}

export interface Material {
  ambient: [number, number, number];
  diffuse: [number, number, number];
  specular: [number, number, number];
  shininess: number;
}
export const CommonMaterials: GenericObject<Material> = {
  [Materials.Default]: {
    ambient: [1.0, 0.5, 0.31],
    diffuse: [1.0, 0.5, 0.31],
    specular: [0.5, 0.5, 0.5],
    shininess: 32.0,
  },
  [Materials.Emerald]: {
    ambient: [0.0215, 0.1745, 0.0215],
    diffuse: [0.07568, 0.61424, 0.07568],
    specular: [0.633, 0.727811, 0.633],
    shininess: 0.6 * 128,
  },
  [Materials.Pearl]: {
    ambient: [0.25, 0.20725, 0.20725],
    diffuse: [1, 0.829, 0.829],
    specular: [0.296648, 0.296648, 0.296648],
    shininess: 0.088 * 128,
  },
  [Materials.Gold]: {
    ambient: [0.24725, 0.1995, 0.0745],
    diffuse: [0.75164, 0.60648, 0.22648],
    specular: [0.628281, 0.555802, 0.366065],
    shininess: 0.4 * 128,
  },
  [Materials.CyanPlastic]: {
    ambient: [0.0, 0.1, 0.06],
    diffuse: [0.0, 0.50980392, 0.50980392],
    specular: [0.50196078, 0.50196078, 0.50196078],
    shininess: 0.25 * 128,
  },
};

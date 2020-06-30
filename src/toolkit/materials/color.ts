export interface Color {
    normalized(): [number, number, number];
}

export function createColor(rgb: [number, number, number]): Color {
    return {
        normalized() {
            return rgb.map(v => v / 255) as [number, number, number];
        },
    };
}

export const Colors = {
    Red: [1.0, 0.0, 0.0],
};

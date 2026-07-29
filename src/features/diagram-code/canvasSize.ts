export interface CanvasSize {
  cssHeight: number;
  cssWidth: number;
  pixelHeight: number;
  pixelWidth: number;
  ratio: number;
}

const validDimension = (value: number, fallback: number) => {
  if (Number.isFinite(value) && value > 0) {
    return value;
  }

  return fallback;
};

export const resolveCanvasSize = (
  width: number,
  height: number,
  devicePixelRatio = 1,
): CanvasSize => {
  const cssWidth = Math.round(validDimension(width, 360));
  const cssHeight = Math.round(validDimension(height, 260));
  const ratio = Math.min(Math.max(validDimension(devicePixelRatio, 1), 1), 3);

  return {
    cssHeight,
    cssWidth,
    pixelHeight: Math.round(cssHeight * ratio),
    pixelWidth: Math.round(cssWidth * ratio),
    ratio,
  };
};

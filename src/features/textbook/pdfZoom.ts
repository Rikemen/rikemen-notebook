export const MIN_PDF_ZOOM = 1;
export const MAX_PDF_ZOOM = 4;
export const PDF_ZOOM_STEP = 0.25;

const roundZoom = (zoom: number) => Math.round(zoom * 100) / 100;

export const clampPdfZoom = (zoom: number) => {
  if (!Number.isFinite(zoom)) {
    return MIN_PDF_ZOOM;
  }
  return roundZoom(Math.min(Math.max(zoom, MIN_PDF_ZOOM), MAX_PDF_ZOOM));
};

export const increasePdfZoom = (zoom: number) => clampPdfZoom(zoom + PDF_ZOOM_STEP);

export const decreasePdfZoom = (zoom: number) => clampPdfZoom(zoom - PDF_ZOOM_STEP);

export const calculatePinchZoom = (
  initialZoom: number,
  initialDistance: number,
  currentDistance: number,
) => {
  const safeInitialZoom = clampPdfZoom(initialZoom);
  if (
    !Number.isFinite(initialDistance) ||
    !Number.isFinite(currentDistance) ||
    initialDistance <= 0 ||
    currentDistance <= 0
  ) {
    return safeInitialZoom;
  }
  return clampPdfZoom(safeInitialZoom * (currentDistance / initialDistance));
};

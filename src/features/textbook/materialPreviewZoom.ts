export const MIN_MATERIAL_ZOOM = 0.25;
export const DEFAULT_MATERIAL_ZOOM = 1;
export const MAX_MATERIAL_ZOOM = 8;
export const MATERIAL_ZOOM_STEP = 0.25;

const roundZoom = (zoom: number) => Math.round(zoom * 100) / 100;

export const clampMaterialZoom = (zoom: number) => {
  if (!Number.isFinite(zoom)) {
    return DEFAULT_MATERIAL_ZOOM;
  }
  return roundZoom(Math.min(Math.max(zoom, MIN_MATERIAL_ZOOM), MAX_MATERIAL_ZOOM));
};

export const increaseMaterialZoom = (zoom: number) => clampMaterialZoom(zoom + MATERIAL_ZOOM_STEP);

export const decreaseMaterialZoom = (zoom: number) => clampMaterialZoom(zoom - MATERIAL_ZOOM_STEP);

export const resetMaterialZoom = () => DEFAULT_MATERIAL_ZOOM;

export const calculatePinchZoom = (initialZoom: number, initialDistance: number, currentDistance: number) => {
  const safeInitialZoom = clampMaterialZoom(initialZoom);
  if (!Number.isFinite(initialDistance) || !Number.isFinite(currentDistance) || initialDistance <= 0 || currentDistance <= 0) {
    return safeInitialZoom;
  }
  return clampMaterialZoom(safeInitialZoom * (currentDistance / initialDistance));
};

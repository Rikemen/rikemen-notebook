export type WorkspaceViewportMode = "desktop" | "tablet" | "mobile";

export interface WorkspaceResponsivePolicy {
  allowFreeMove: boolean;
  allowResize: boolean;
  columns: number;
  mode: WorkspaceViewportMode;
}

export const getWorkspaceViewportMode = (width: number): WorkspaceViewportMode => {
  if (width < 768) {
    return "mobile";
  }

  if (width < 1280) {
    return "tablet";
  }

  return "desktop";
};

export const getWorkspaceResponsivePolicy = (width: number): WorkspaceResponsivePolicy => {
  const mode = getWorkspaceViewportMode(width);

  if (mode === "desktop") {
    return {
      allowFreeMove: true,
      allowResize: true,
      columns: 4,
      mode,
    };
  }

  if (mode === "tablet") {
    return {
      allowFreeMove: false,
      allowResize: true,
      columns: 2,
      mode,
    };
  }

  return {
    allowFreeMove: false,
    allowResize: false,
    columns: 1,
    mode,
  };
};

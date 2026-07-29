export type DiagramCodeMode = "diagram" | "code";

export interface DiagramCodeState {
  mode: DiagramCodeMode;
}

export const switchDiagramCodeMode = (state: DiagramCodeState, mode: DiagramCodeMode): DiagramCodeState => ({
  ...state,
  mode,
});

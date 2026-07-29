export interface WhiteboardPoint {
  x: number;
  y: number;
}

export interface WhiteboardStroke {
  points: WhiteboardPoint[];
}

export interface WhiteboardDrawing {
  id: string;
  dataUrl: string;
  strokes: WhiteboardStroke[];
  createdAt: string;
  updatedAt: string;
}

export const createDrawingMarkdown = (drawingId: string) => `![手書き](drawing:${drawingId})`;

export const createWhiteboardDrawing = (params: {
  dataUrl: string;
  id: string;
  nowIso: string;
  strokes: WhiteboardStroke[];
}): WhiteboardDrawing => ({
  createdAt: params.nowIso,
  dataUrl: params.dataUrl,
  id: params.id,
  strokes: params.strokes,
  updatedAt: params.nowIso,
});

export const upsertWhiteboardDrawing = (drawings: WhiteboardDrawing[], drawing: WhiteboardDrawing) => {
  const index = drawings.findIndex((candidate) => candidate.id === drawing.id);
  if (index === -1) {
    return [...drawings, drawing];
  }

  return drawings.map((candidate) => {
    if (candidate.id === drawing.id) {
      return drawing;
    }

    return candidate;
  });
};

export const removeWhiteboardDrawing = (
  drawings: WhiteboardDrawing[],
  drawingId: string,
) => drawings.filter((drawing) => drawing.id !== drawingId);

export const removeDrawingMarkdownReference = (markdown: string, drawingId: string) =>
  markdown
    .split(createDrawingMarkdown(drawingId))
    .join("")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();

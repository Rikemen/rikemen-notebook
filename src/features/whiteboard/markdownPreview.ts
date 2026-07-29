/* eslint-disable complexity, max-statements, sonarjs/cognitive-complexity */
import type { WhiteboardDrawing } from "@/features/whiteboard/whiteboardDrawings";

export type MarkdownPreviewBlock =
  | { id: string; level: number; text: string; type: "heading" }
  | { id: string; items: string[]; type: "list" }
  | { id: string; text: string; type: "code" | "paragraph" }
  | { drawing: WhiteboardDrawing; id: string; type: "drawing" };

const drawingPattern = /^!\[手書き\]\(drawing:(?<drawingId>[^)]+)\)$/u;
const headingPattern = /^#{1,3}/u;

const createParagraph = (id: string, text: string): MarkdownPreviewBlock => ({
  id,
  text,
  type: "paragraph",
});

export const renderMarkdownPreview = (markdown: string, drawings: WhiteboardDrawing[]): MarkdownPreviewBlock[] => {
  const drawingMap = new Map(drawings.map((drawing) => [drawing.id, drawing]));
  const blocks: MarkdownPreviewBlock[] = [];
  const lines = markdown.split(/\r?\n/u);
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();
    const drawingMatch = drawingPattern.exec(trimmed);

    if (!trimmed) {
      index += 1;
    } else if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? "").trim().startsWith("```")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }
      blocks.push({ id: `code-${index}`, text: codeLines.join("\n"), type: "code" });
      index += 1;
    } else if (drawingMatch?.groups?.drawingId && drawingMap.has(drawingMatch.groups.drawingId)) {
      const { drawingId } = drawingMatch.groups;
      blocks.push({ drawing: drawingMap.get(drawingId) as WhiteboardDrawing, id: `drawing-${drawingId}`, type: "drawing" });
      index += 1;
    } else if (trimmed.startsWith("#")) {
      const marker = headingPattern.exec(trimmed)?.[0] ?? "#";
      blocks.push({ id: `heading-${index}`, level: marker.length, text: trimmed.slice(marker.length).trim(), type: "heading" });
      index += 1;
    } else if (trimmed.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && (lines[index] ?? "").trim().startsWith("- ")) {
        items.push((lines[index] ?? "").trim().slice(2));
        index += 1;
      }
      blocks.push({ id: `list-${index}`, items, type: "list" });
    } else {
      blocks.push(createParagraph(`paragraph-${index}`, trimmed));
      index += 1;
    }
  }

  return blocks;
};

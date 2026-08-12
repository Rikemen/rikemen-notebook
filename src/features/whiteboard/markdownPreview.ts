/* eslint-disable complexity, max-lines-per-function, max-statements, sonarjs/cognitive-complexity */
import type { WhiteboardDrawing } from "@/features/whiteboard/whiteboardDrawings";

export type MarkdownInlineNode =
  | { text: string; type: "text" }
  | { children: MarkdownInlineNode[]; type: "strong" | "emphasis" | "underline" | "strikethrough" };

export type MarkdownPreviewBlock =
  | { content: MarkdownInlineNode[]; id: string; level: number; type: "heading" }
  | { id: string; items: MarkdownInlineNode[][]; type: "list" }
  | { id: string; text: string; type: "code" }
  | { content: MarkdownInlineNode[]; id: string; type: "paragraph" | "quote" }
  | { drawing: WhiteboardDrawing; id: string; type: "drawing" };

interface InlineDelimiter {
  close: string;
  open: string;
  type: "strong" | "emphasis" | "underline" | "strikethrough";
}

interface InlineMatch extends InlineDelimiter {
  closeIndex: number;
  openIndex: number;
}

const drawingPattern = /^!\[手書き\]\(drawing:(?<drawingId>[^)]+)\)$/u;
const headingPattern = /^#{1,3}/u;
const inlineDelimiters: InlineDelimiter[] = [
  { close: "</u>", open: "<u>", type: "underline" },
  { close: "**", open: "**", type: "strong" },
  { close: "~~", open: "~~", type: "strikethrough" },
  { close: "*", open: "*", type: "emphasis" },
];

const isStandaloneAsterisk = (value: string, index: number) => value[index - 1] !== "*" && value[index + 1] !== "*";

const findNextInlineMatch = (value: string, fromIndex: number): InlineMatch | null => {
  let nearest: InlineMatch | null = null;
  for (const delimiter of inlineDelimiters) {
    let openIndex = value.indexOf(delimiter.open, fromIndex);
    while (delimiter.type === "emphasis" && openIndex !== -1 && !isStandaloneAsterisk(value, openIndex)) {
      openIndex = value.indexOf(delimiter.open, openIndex + 1);
    }
    if (openIndex !== -1) {
      let closeIndex = value.indexOf(delimiter.close, openIndex + delimiter.open.length);
      while (delimiter.type === "emphasis" && closeIndex !== -1 && !isStandaloneAsterisk(value, closeIndex)) {
        closeIndex = value.indexOf(delimiter.close, closeIndex + 1);
      }
      if (closeIndex !== -1 && (!nearest || openIndex < nearest.openIndex)) {
        nearest = { ...delimiter, closeIndex, openIndex };
      }
    }
  }
  return nearest;
};

const appendText = (nodes: MarkdownInlineNode[], text: string) => {
  if (!text) return;
  const lastNode = nodes.at(-1);
  if (lastNode?.type === "text") {
    lastNode.text += text;
    return;
  }
  nodes.push({ text, type: "text" });
};

export const parseMarkdownInline = (value: string): MarkdownInlineNode[] => {
  const nodes: MarkdownInlineNode[] = [];
  let index = 0;
  while (index < value.length) {
    const match = findNextInlineMatch(value, index);
    if (!match) {
      appendText(nodes, value.slice(index));
      break;
    }
    appendText(nodes, value.slice(index, match.openIndex));
    const innerStart = match.openIndex + match.open.length;
    nodes.push({
      children: parseMarkdownInline(value.slice(innerStart, match.closeIndex)),
      type: match.type,
    });
    index = match.closeIndex + match.close.length;
  }
  return nodes;
};

const createParagraph = (id: string, text: string): MarkdownPreviewBlock => ({
  content: parseMarkdownInline(text),
  id,
  type: "paragraph",
});

const isQuoteLine = (line: string) => {
  const trimmed = line.trim();
  return trimmed === ">" || trimmed.startsWith("> ");
};

const quoteText = (line: string) => line.trim().replace(/^> ?/u, "");

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
    } else if (isQuoteLine(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && isQuoteLine(lines[index] ?? "")) {
        quoteLines.push(quoteText(lines[index] ?? ""));
        index += 1;
      }
      blocks.push({ content: parseMarkdownInline(quoteLines.join("\n")), id: `quote-${index}`, type: "quote" });
    } else if (trimmed.startsWith("#")) {
      const marker = headingPattern.exec(trimmed)?.[0] ?? "#";
      blocks.push({
        content: parseMarkdownInline(trimmed.slice(marker.length).trim()),
        id: `heading-${index}`,
        level: marker.length,
        type: "heading",
      });
      index += 1;
    } else if (trimmed.startsWith("- ")) {
      const items: MarkdownInlineNode[][] = [];
      while (index < lines.length && (lines[index] ?? "").trim().startsWith("- ")) {
        items.push(parseMarkdownInline((lines[index] ?? "").trim().slice(2)));
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

export type MarkdownFormatAction = "bold" | "italic" | "underline" | "strikethrough" | "quote" | "code-block";

export interface MarkdownFormattingResult {
  selectionEnd: number;
  selectionStart: number;
  value: string;
}

export interface MarkdownFormattingRequest {
  action: MarkdownFormatAction;
  selectionEnd: number;
  selectionStart: number;
  value: string;
}

interface SelectionRange {
  end: number;
  start: number;
}

const inlineMarkers: Record<Exclude<MarkdownFormatAction, "quote" | "code-block">, [string, string]> = {
  bold: ["**", "**"],
  italic: ["*", "*"],
  strikethrough: ["~~", "~~"],
  underline: ["<u>", "</u>"],
};

const normalizeRange = (value: string, selectionStart: number, selectionEnd: number): SelectionRange => {
  const first = Math.max(0, Math.min(value.length, selectionStart));
  const second = Math.max(0, Math.min(value.length, selectionEnd));
  return { end: Math.max(first, second), start: Math.min(first, second) };
};

const unchanged = (value: string, range: SelectionRange): MarkdownFormattingResult => ({
  selectionEnd: range.end,
  selectionStart: range.start,
  value,
});

const applyInlineFormatting = (value: string, range: SelectionRange, markers: [string, string]): MarkdownFormattingResult => {
  const [opening, closing] = markers;
  const hasMarkers =
    range.start >= opening.length &&
    value.slice(range.start - opening.length, range.start) === opening &&
    value.slice(range.end, range.end + closing.length) === closing;

  if (hasMarkers) {
    return {
      selectionEnd: range.end - opening.length,
      selectionStart: range.start - opening.length,
      value: `${value.slice(0, range.start - opening.length)}${value.slice(range.start, range.end)}${value.slice(range.end + closing.length)}`,
    };
  }

  return {
    selectionEnd: range.end + opening.length,
    selectionStart: range.start + opening.length,
    value: `${value.slice(0, range.start)}${opening}${value.slice(range.start, range.end)}${closing}${value.slice(range.end)}`,
  };
};

const expandToLineRange = (value: string, range: SelectionRange): SelectionRange => {
  const start = value.lastIndexOf("\n", Math.max(0, range.start - 1)) + 1;
  let endProbe = range.end;
  if (range.end > start && value[range.end - 1] === "\n") endProbe -= 1;
  const nextNewline = value.indexOf("\n", endProbe);
  let end = nextNewline;
  if (nextNewline === -1) end = value.length;
  return { end, start };
};

const applyQuoteFormatting = (value: string, range: SelectionRange): MarkdownFormattingResult => {
  const lineRange = expandToLineRange(value, range);
  const lines = value.slice(lineRange.start, lineRange.end).split("\n");
  const isQuoted = lines.every((line) => line === ">" || line.startsWith("> "));
  const replacement = lines
    .map((line) => {
      if (isQuoted) return line.replace(/^> ?/u, "");
      return `> ${line}`;
    })
    .join("\n");
  return {
    selectionEnd: lineRange.start + replacement.length,
    selectionStart: lineRange.start,
    value: `${value.slice(0, lineRange.start)}${replacement}${value.slice(lineRange.end)}`,
  };
};

const applyCodeBlockFormatting = (value: string, range: SelectionRange): MarkdownFormattingResult => {
  const opening = "```\n";
  const closing = "\n```";
  const hasMarkers =
    range.start >= opening.length &&
    value.slice(range.start - opening.length, range.start) === opening &&
    value.slice(range.end, range.end + closing.length) === closing;
  if (hasMarkers) {
    return {
      selectionEnd: range.end - opening.length,
      selectionStart: range.start - opening.length,
      value: `${value.slice(0, range.start - opening.length)}${value.slice(range.start, range.end)}${value.slice(range.end + closing.length)}`,
    };
  }

  const lineRange = expandToLineRange(value, range);
  const selected = value.slice(lineRange.start, lineRange.end);
  return {
    selectionEnd: lineRange.start + opening.length + selected.length,
    selectionStart: lineRange.start + opening.length,
    value: `${value.slice(0, lineRange.start)}${opening}${selected}${closing}${value.slice(lineRange.end)}`,
  };
};

export const applyMarkdownFormatting = ({ action, selectionEnd, selectionStart, value }: MarkdownFormattingRequest): MarkdownFormattingResult => {
  const range = normalizeRange(value, selectionStart, selectionEnd);
  if (range.start === range.end) return unchanged(value, range);
  if (action === "quote") return applyQuoteFormatting(value, range);
  if (action === "code-block") return applyCodeBlockFormatting(value, range);
  return applyInlineFormatting(value, range, inlineMarkers[action]);
};

/* eslint-disable max-statements, prefer-named-capture-group */
export interface TextSegment {
  kind: "text";
  text: string;
}

export interface MathSegment {
  expression: string;
  kind: "math";
}

export type MessageSegment = MathSegment | TextSegment;

export const splitMathSegments = (text: string): MessageSegment[] => {
  const segments: MessageSegment[] = [];
  const pattern = /\$([^$]+)\$/gu;
  let cursor = 0;
  let match = pattern.exec(text);

  while (match) {
    if (match.index > cursor) {
      segments.push({
        kind: "text",
        text: text.slice(cursor, match.index),
      });
    }

    segments.push({
      expression: match[1],
      kind: "math",
    });
    cursor = match.index + match[0].length;
    match = pattern.exec(text);
  }

  if (cursor < text.length) {
    segments.push({
      kind: "text",
      text: text.slice(cursor),
    });
  }

  return segments;
};

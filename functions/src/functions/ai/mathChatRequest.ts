import type {
  MathChatMessage,
  MathChatOperation,
  MathChatRequest,
} from "./types";

const MAX_IDENTIFIER_LENGTH = 128;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES = 60;
const MAX_SUMMARY_LENGTH = 4000;
const MAX_TOTAL_MESSAGE_LENGTH = 60000;
const REQUEST_KEYS = new Set([
  "inheritedSummary",
  "messages",
  "noteId",
  "operation",
  "prompt",
  "threadId",
]);
const MESSAGE_KEYS = new Set(["role", "text"]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]+$/u;

export class MathChatRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MathChatRequestValidationError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertOnlyKeys = (
  value: Record<string, unknown>,
  allowedKeys: Set<string>,
  target: string,
) => {
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new MathChatRequestValidationError(`${target}に未対応の項目があります。`);
  }
};

const parseIdentifier = (value: unknown, fieldName: string) => {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_IDENTIFIER_LENGTH ||
    !IDENTIFIER_PATTERN.test(value)
  ) {
    throw new MathChatRequestValidationError(`${fieldName}が不正です。`);
  }
  return value;
};

const parseLimitedText = (
  value: unknown,
  fieldName: string,
  maxLength: number,
  required = true,
) => {
  if (typeof value !== "string") {
    if (!required && value === undefined) {
      return undefined;
    }
    throw new MathChatRequestValidationError(`${fieldName}は文字列で指定してください。`);
  }
  const normalized = value.trim();
  if ((required && normalized.length === 0) || normalized.length > maxLength) {
    throw new MathChatRequestValidationError(
      `${fieldName}は1文字以上${maxLength}文字以内で指定してください。`,
    );
  }
  return normalized;
};

const parseOperation = (value: unknown): MathChatOperation => {
  if (value !== "respond" && value !== "summarize") {
    throw new MathChatRequestValidationError("operationが不正です。");
  }
  return value;
};

const parseMessage = (value: unknown): MathChatMessage => {
  if (!isRecord(value)) {
    throw new MathChatRequestValidationError("会話履歴の形式が不正です。");
  }
  assertOnlyKeys(value, MESSAGE_KEYS, "会話履歴");
  if (value.role !== "user" && value.role !== "assistant") {
    throw new MathChatRequestValidationError("会話履歴のroleが不正です。");
  }
  return {
    role: value.role,
    text: parseLimitedText(value.text, "会話本文", MAX_MESSAGE_LENGTH) as string,
  };
};

const parseMessages = (value: unknown) => {
  if (!Array.isArray(value) || value.length > MAX_MESSAGES) {
    throw new MathChatRequestValidationError(`会話履歴は${MAX_MESSAGES}件以内で指定してください。`);
  }
  const messages = value.map(parseMessage);
  const totalLength = messages.reduce((total, message) => total + message.text.length, 0);
  if (totalLength > MAX_TOTAL_MESSAGE_LENGTH) {
    throw new MathChatRequestValidationError("会話履歴の合計文字数が上限を超えています。");
  }
  return messages;
};

const assertCompleteTurns = (
  messages: MathChatMessage[],
  operation: MathChatOperation,
) => {
  const expectedLength = operation === "summarize" ? MAX_MESSAGES : undefined;
  if (
    expectedLength !== undefined &&
    messages.length !== expectedLength
  ) {
    throw new MathChatRequestValidationError(
      "要約には30ターン分（60件）の会話履歴が必要です。",
    );
  }
  if (operation === "respond" && messages.length > MAX_MESSAGES - 2) {
    throw new MathChatRequestValidationError(
      "このチャットは30ターン上限に達しています。",
    );
  }
  const hasInvalidOrder = messages.some((message, index) => {
    const expectedRole = index % 2 === 0 ? "user" : "assistant";
    return message.role !== expectedRole;
  });
  if (messages.length % 2 !== 0 || hasInvalidOrder) {
    throw new MathChatRequestValidationError(
      "会話履歴はuserとassistantの完了済みターンで指定してください。",
    );
  }
};

export const parseMathChatRequest = (value: unknown): MathChatRequest => {
  if (!isRecord(value)) {
    throw new MathChatRequestValidationError("リクエスト形式が不正です。");
  }
  assertOnlyKeys(value, REQUEST_KEYS, "リクエスト");
  const operation = parseOperation(value.operation);
  const messages = parseMessages(value.messages);
  assertCompleteTurns(messages, operation);
  const request: MathChatRequest = {
    messages,
    noteId: parseIdentifier(value.noteId, "noteId"),
    operation,
    threadId: parseIdentifier(value.threadId, "threadId"),
  };
  const inheritedSummary = parseLimitedText(
    value.inheritedSummary,
    "引き継ぎ要約",
    MAX_SUMMARY_LENGTH,
    false,
  );
  if (inheritedSummary) {
    request.inheritedSummary = inheritedSummary;
  }
  if (operation === "respond") {
    request.prompt = parseLimitedText(
      value.prompt,
      "質問",
      MAX_MESSAGE_LENGTH,
    ) as string;
  } else if (value.prompt !== undefined) {
    throw new MathChatRequestValidationError("要約時にpromptは指定できません。");
  }
  return request;
};

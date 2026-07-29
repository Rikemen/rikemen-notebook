export type MathChatOperation = "respond" | "summarize";

export interface MathChatMessage {
  role: "assistant" | "user";
  text: string;
}

export interface MathChatRequest {
  inheritedSummary?: string;
  messages: MathChatMessage[];
  noteId: string;
  operation: MathChatOperation;
  prompt?: string;
  threadId: string;
}

export interface OpenAiGenerationRequest {
  input: string;
  instructions: string;
  maxOutputTokens: number;
  model: string;
}

export interface OpenAiResponsesPort {
  generate(request: OpenAiGenerationRequest): Promise<string>;
}

export interface OpenAiMathService {
  respond(request: MathChatRequest): Promise<string>;
  summarize(request: MathChatRequest): Promise<string>;
}

import type {
  OpenAiGenerationRequest,
  OpenAiResponsesPort,
} from "./types";
import { OPENAI_REQUEST_TIMEOUT_MS } from "./config";

interface OpenAiResponse {
  output_text?: string;
}

export interface OpenAiClient {
  responses: {
    create(request: {
      input: string;
      instructions: string;
      max_output_tokens: number;
      model: string;
    }): Promise<OpenAiResponse>;
  };
}

interface OpenAiConstructor {
  new (options: { apiKey: string; timeout: number }): OpenAiClient;
}

export const createOpenAiResponsesPortFromClient = (
  client: OpenAiClient,
): OpenAiResponsesPort => ({
  generate: async (request: OpenAiGenerationRequest) => {
    const response = await client.responses.create({
      input: request.input,
      instructions: request.instructions,
      max_output_tokens: request.maxOutputTokens,
      model: request.model,
    });
    return response.output_text ?? "";
  },
});

export const createOpenAiResponsesPort = (
  apiKey: string,
): OpenAiResponsesPort => {
  // Dynamic require keeps the SDK dependency inside the server adapter.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const openAiModule = require("openai") as OpenAiConstructor & {
    default?: OpenAiConstructor;
  };
  let OpenAiClass: OpenAiConstructor = openAiModule;
  if (openAiModule.default) {
    OpenAiClass = openAiModule.default;
  }
  const client = new OpenAiClass({
    apiKey,
    timeout: OPENAI_REQUEST_TIMEOUT_MS,
  });

  return createOpenAiResponsesPortFromClient(client);
};

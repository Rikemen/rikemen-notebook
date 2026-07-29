import { functions } from "@/utils/firebase";
import { httpsCallable } from "firebase/functions";
import {
  OPEN_AI_MATH_CHAT_FUNCTION_NAME,
  type MathChatPayload,
} from "@/features/ai/functionsOpenAiClient";

export const testFunctions = httpsCallable(functions, "test");
export const streamingFcuntion = httpsCallable(functions, "streamingCall");

const mathChatCallable = httpsCallable<MathChatPayload, { text: string }>(
  functions,
  OPEN_AI_MATH_CHAT_FUNCTION_NAME,
);

export const callMathChatMessage = async (payload: MathChatPayload) => {
  const result = await mathChatCallable(payload);
  return result.data;
};

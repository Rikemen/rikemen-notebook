import { functions } from "@/utils/firebase";
import { httpsCallable } from "firebase/functions";
import {
  OPEN_AI_MATH_CHAT_FUNCTION_NAME,
  type MathChatPayload,
} from "@/features/ai/functionsOpenAiClient";

export const testFunctions = httpsCallable(functions, "test");
export const streamingFcuntion = httpsCallable(functions, "streamingCall");

export type DeleteNotebookStatus = "deleted" | "missing" | "pending";

const deleteNotebookCallable = httpsCallable<
  { noteId: string },
  { status: DeleteNotebookStatus }
>(functions, "deleteNotebook");

export const callDeleteNotebook = async (noteId: string) => {
  const result = await deleteNotebookCallable({ noteId });
  return result.data;
};

const mathChatCallable = httpsCallable<MathChatPayload, { text: string }>(
  functions,
  OPEN_AI_MATH_CHAT_FUNCTION_NAME,
);

export const callMathChatMessage = async (payload: MathChatPayload) => {
  const result = await mathChatCallable(payload);
  return result.data;
};

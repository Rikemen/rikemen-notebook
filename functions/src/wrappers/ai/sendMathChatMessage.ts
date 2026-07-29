import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { defineSecret, defineString } from "firebase-functions/params";
import { onCall } from "firebase-functions/v2/https";
import {
  DEFAULT_OPENAI_MODEL,
  OPENAI_API_KEY_SECRET_NAME,
  OPENAI_MODEL_PARAMETER_NAME,
} from "../../functions/ai/config";
import { createFirestoreNoteOwnership } from "../../functions/ai/noteOwnership";
import { createOpenAiMathService } from "../../functions/ai/openAiMathService";
import { createOpenAiResponsesPort } from "../../functions/ai/openAiResponsesPort";
import {
  createFirestoreAiQuotaRepository,
  createServerAiQuotaService,
} from "../../functions/ai/serverAiQuota";
import { createSendMathChatMessageHandler } from "../../functions/ai/sendMathChatMessage";

const openAiApiKey = defineSecret(OPENAI_API_KEY_SECRET_NAME);
const openAiModel = defineString(OPENAI_MODEL_PARAMETER_NAME, {
  default: DEFAULT_OPENAI_MODEL,
  description: "Gauss Notebookの数学AIチャットで使用するOpenAIモデル",
});

const firebaseApp = getApps()[0] ?? initializeApp();
const database = getFirestore(firebaseApp);

export default onCall(
  {
    memory: "512MiB",
    region: "asia-northeast1",
    secrets: [openAiApiKey],
    timeoutSeconds: 60,
  },
  async (request) => {
    const aiPort = createOpenAiResponsesPort(openAiApiKey.value());
    const handler = createSendMathChatMessageHandler({
      aiService: createOpenAiMathService(aiPort, {
        model: openAiModel.value(),
      }),
      noteOwnership: createFirestoreNoteOwnership(database),
      onAiError: (error) => {
        logger.error("OpenAI math chat request failed", {
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      },
      quota: createServerAiQuotaService(
        createFirestoreAiQuotaRepository(database),
      ),
    });

    return handler(request);
  },
);

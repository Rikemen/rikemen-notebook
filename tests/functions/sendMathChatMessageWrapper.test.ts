import { describe, expect, it } from "vitest";
import wrapperSource from "../../functions/src/wrappers/ai/sendMathChatMessage.ts?raw";
import indexSource from "../../functions/src/index.ts?raw";

describe("sendMathChatMessageWrapper", () => {
  it("asia-northeast1・timeout・SecretをCallableへ設定する", () => {
    expect(wrapperSource).toContain('region: "asia-northeast1"');
    expect(wrapperSource).toContain("timeoutSeconds: 60");
    expect(wrapperSource).toContain("secrets: [openAiApiKey]");
    expect(wrapperSource).toContain("createSendMathChatMessageHandler");
  });

  it("Functions indexからsendMathChatMessageを公開する", () => {
    expect(indexSource).toContain(
      'exportIfNeeded("sendMathChatMessage", "ai/sendMathChatMessage", exports)',
    );
  });
});

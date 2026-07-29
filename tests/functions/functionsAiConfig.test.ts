import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPENAI_MODEL,
  OPENAI_API_KEY_SECRET_NAME,
  OPENAI_MODEL_PARAMETER_NAME,
  OPENAI_REQUEST_TIMEOUT_MS,
} from "../../functions/src/functions/ai/config";
import functionsGitignore from "../../functions/.gitignore?raw";

describe("functionsAiConfig", () => {
  it("Secret名と差し替え可能なモデル設定を一元化する", () => {
    expect(OPENAI_API_KEY_SECRET_NAME).toBe("OPENAI_API_KEY");
    expect(OPENAI_MODEL_PARAMETER_NAME).toBe("OPENAI_MODEL");
    expect(DEFAULT_OPENAI_MODEL).toBe("gpt-5.6-luna");
    expect(OPENAI_REQUEST_TIMEOUT_MS).toBe(30000);
  });

  it("Local Emulator用secretをGit管理から除外する", () => {
    expect(functionsGitignore).toContain(".secret.local");
    expect(functionsGitignore).toContain(".env.local");
  });
});

import { describe, expect, it } from "vitest";
import {
  ANONYMOUS_UPLOAD_LIMIT_BYTES,
  SIGNED_IN_DAILY_AI_LIMIT,
  SIGNED_IN_UPLOAD_LIMIT_BYTES,
  canPersistHistory,
  canUploadFile,
  canUseAi,
  getDailyAiLimit,
  getUploadLimitBytes,
} from "@/features/auth/accessPolicy";
import type { AuthUser } from "@/features/auth/types";

const signedInUser: AuthUser = {
  displayName: "Rike Men",
  email: "rike@example.com",
  photoURL: null,
  uid: "user-1",
};

describe("accessPolicy", () => {
  it("未ログインは AI と保存履歴を使えずアップロードは10MBまで", () => {
    expect(canUseAi(null)).toBe(false);
    expect(canPersistHistory(null)).toBe(false);
    expect(getDailyAiLimit(null)).toBe(0);
    expect(getUploadLimitBytes(null)).toBe(ANONYMOUS_UPLOAD_LIMIT_BYTES);
    expect(canUploadFile(ANONYMOUS_UPLOAD_LIMIT_BYTES, null)).toBe(true);
    expect(canUploadFile(ANONYMOUS_UPLOAD_LIMIT_BYTES + 1, null)).toBe(false);
  });

  it("ログイン済みは AI を1日100回まで使え、アップロードは5GBまで", () => {
    expect(canUseAi(signedInUser)).toBe(true);
    expect(canPersistHistory(signedInUser)).toBe(true);
    expect(getDailyAiLimit(signedInUser)).toBe(SIGNED_IN_DAILY_AI_LIMIT);
    expect(getUploadLimitBytes(signedInUser)).toBe(SIGNED_IN_UPLOAD_LIMIT_BYTES);
    expect(canUploadFile(SIGNED_IN_UPLOAD_LIMIT_BYTES, signedInUser)).toBe(true);
    expect(canUploadFile(SIGNED_IN_UPLOAD_LIMIT_BYTES + 1, signedInUser)).toBe(false);
  });

  it("0バイト以下のアップロードは拒否する", () => {
    expect(canUploadFile(0, signedInUser)).toBe(false);
    expect(canUploadFile(-1, signedInUser)).toBe(false);
  });
});


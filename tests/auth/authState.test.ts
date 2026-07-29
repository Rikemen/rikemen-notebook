import { describe, expect, it } from "vitest";
import { createAuthState, mapFirebaseUser } from "@/features/auth/mapFirebaseUser";

describe("authState", () => {
  it("Firebase User からアプリ用ユーザーへ変換する", () => {
    expect(
      mapFirebaseUser({
        displayName: "Rike Men",
        email: "rike@example.com",
        photoURL: "https://example.com/photo.png",
        uid: "user-1",
      }),
    ).toEqual({
      displayName: "Rike Men",
      email: "rike@example.com",
      photoURL: "https://example.com/photo.png",
      uid: "user-1",
    });
  });

  it("未ログインは null と signed-out にする", () => {
    expect(mapFirebaseUser(null)).toBeNull();
    expect(createAuthState(null)).toEqual({
      status: "signed-out",
      user: null,
    });
  });

  it("判定中は loading として扱う", () => {
    expect(createAuthState(undefined)).toEqual({
      status: "loading",
      user: null,
    });
  });
});


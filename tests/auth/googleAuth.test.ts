import { describe, expect, it, vi } from "vitest";
import type { Auth, AuthError, AuthProvider, UserCredential } from "firebase/auth";
import { createGoogleProvider, signInWithGoogle, type PopupSignIn } from "@/features/auth/googleAuth";

const targetAuth = {} as Auth;

describe("googleAuth", () => {
  it("email scope を持つ Google provider を作る", () => {
    const provider = createGoogleProvider();

    expect(provider.providerId).toBe("google.com");
  });

  it("Google provider で popup sign in を実行する", async () => {
    const popupSignIn = vi.fn<PopupSignIn>().mockResolvedValue({} as UserCredential);

    await expect(signInWithGoogle(targetAuth, popupSignIn)).resolves.toEqual({
      ok: true,
    });
    expect(popupSignIn).toHaveBeenCalledOnce();
    expect(popupSignIn.mock.calls[0]?.[0]).toBe(targetAuth);
    expect((popupSignIn.mock.calls[0]?.[1] as AuthProvider).providerId).toBe("google.com");
  });

  it("認証エラーを戻り値で扱う", async () => {
    const error = {
      code: "auth/popup-closed-by-user",
      message: "closed",
      name: "FirebaseError",
    } as AuthError;
    const popupSignIn = vi.fn<PopupSignIn>().mockRejectedValue(error);

    await expect(signInWithGoogle(targetAuth, popupSignIn)).resolves.toEqual({
      error,
      ok: false,
    });
  });
});


import { GoogleAuthProvider, signInWithPopup, type Auth, type AuthError, type AuthProvider, type UserCredential } from "firebase/auth";
import { auth } from "@/utils/firebase";

export type PopupSignIn = (targetAuth: Auth, provider: AuthProvider) => Promise<UserCredential>;

export interface GoogleAuthResult {
  ok: boolean;
  error?: AuthError;
}

export const createGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  return provider;
};

export const signInWithGoogle = async (
  targetAuth: Auth = auth,
  popupSignIn: PopupSignIn = signInWithPopup,
): Promise<GoogleAuthResult> => {
  try {
    await popupSignIn(targetAuth, createGoogleProvider());
    return {
      ok: true,
    };
  } catch (error: unknown) {
    return {
      error: error as AuthError,
      ok: false,
    };
  }
};


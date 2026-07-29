import type { User } from "firebase/auth";
import type { AuthState, AuthUser } from "@/features/auth/types";

export const mapFirebaseUser = (user: Pick<User, "uid" | "email" | "displayName" | "photoURL"> | null): AuthUser | null => {
  if (!user) {
    return null;
  }

  return {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    uid: user.uid,
  };
};

export const createAuthState = (
  user: Pick<User, "uid" | "email" | "displayName" | "photoURL"> | null | undefined,
): AuthState => {
  if (user === undefined) {
    return {
      status: "loading",
      user: null,
    };
  }

  const mappedUser = mapFirebaseUser(user);
  if (mappedUser) {
    return {
      status: "signed-in",
      user: mappedUser,
    };
  }

  return {
    status: "signed-out",
    user: null,
  };
};

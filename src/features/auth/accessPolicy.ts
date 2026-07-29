import type { AuthUser } from "@/features/auth/types";

export const ANONYMOUS_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;
export const SIGNED_IN_UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;
export const SIGNED_IN_DAILY_AI_LIMIT = 100;

export const isSignedInUser = (user: AuthUser | null | undefined): user is AuthUser => Boolean(user?.uid);

export const canUseAi = (user: AuthUser | null | undefined) => isSignedInUser(user);

export const canPersistHistory = (user: AuthUser | null | undefined) => isSignedInUser(user);

export const getUploadLimitBytes = (user: AuthUser | null | undefined) => {
  if (isSignedInUser(user)) {
    return SIGNED_IN_UPLOAD_LIMIT_BYTES;
  }

  return ANONYMOUS_UPLOAD_LIMIT_BYTES;
};

export const getDailyAiLimit = (user: AuthUser | null | undefined) => {
  if (isSignedInUser(user)) {
    return SIGNED_IN_DAILY_AI_LIMIT;
  }

  return 0;
};

export const canUploadFile = (fileSizeBytes: number, user: AuthUser | null | undefined) =>
  fileSizeBytes > 0 && fileSizeBytes <= getUploadLimitBytes(user);

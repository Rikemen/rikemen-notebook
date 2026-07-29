import type { RouteLocationNormalizedGeneric } from "vue-router";
import type { AuthUser } from "@/features/auth/types";
import { canPersistHistory } from "@/features/auth/accessPolicy";

export const requiresPersistentUserData = (route: Pick<RouteLocationNormalizedGeneric, "matched" | "meta">) =>
  Boolean(route.meta.requiresPersistentUserData) || route.matched.some((record) => Boolean(record.meta.requiresPersistentUserData));

export const requiresAuth = (route: Pick<RouteLocationNormalizedGeneric, "matched" | "meta">) =>
  Boolean(route.meta.requiresAuth) || route.matched.some((record) => Boolean(record.meta.requiresAuth));

export const canAccessRoute = (route: Pick<RouteLocationNormalizedGeneric, "matched" | "meta">, user: AuthUser | null | undefined) => {
  if (requiresPersistentUserData(route)) {
    return canPersistHistory(user);
  }

  if (requiresAuth(route)) {
    return Boolean(user);
  }

  return true;
};


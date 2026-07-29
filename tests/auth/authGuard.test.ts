import { describe, expect, it } from "vitest";
import type { RouteLocationNormalizedGeneric } from "vue-router";
import { canAccessRoute, requiresAuth, requiresPersistentUserData } from "@/features/auth/authGuard";
import type { AuthUser } from "@/features/auth/types";

const signedInUser: AuthUser = {
  displayName: null,
  email: "rike@example.com",
  photoURL: null,
  uid: "user-1",
};

const routeWithMeta = (meta: RouteLocationNormalizedGeneric["meta"]) =>
  ({
    matched: [],
    meta,
  }) as Pick<RouteLocationNormalizedGeneric, "matched" | "meta">;

describe("authGuard", () => {
  it("認証不要ルートは未ログインでも通す", () => {
    const route = routeWithMeta({});

    expect(requiresAuth(route)).toBe(false);
    expect(canAccessRoute(route, null)).toBe(true);
  });

  it("認証必須ルートはログインユーザーだけ通す", () => {
    const route = routeWithMeta({ requiresAuth: true });

    expect(requiresAuth(route)).toBe(true);
    expect(canAccessRoute(route, null)).toBe(false);
    expect(canAccessRoute(route, signedInUser)).toBe(true);
  });

  it("保存履歴必須ルートはログインユーザーだけ通す", () => {
    const route = routeWithMeta({ requiresPersistentUserData: true });

    expect(requiresPersistentUserData(route)).toBe(true);
    expect(canAccessRoute(route, null)).toBe(false);
    expect(canAccessRoute(route, signedInUser)).toBe(true);
  });
});


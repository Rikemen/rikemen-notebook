import { describe, expect, it } from "vitest";
import { routeChildren } from "@/router";

describe("authRoutes", () => {
  it("新規登録とログインを別ルートとして持つ", () => {
    expect(routeChildren.some((route) => route.path === "signup")).toBe(true);
    expect(routeChildren.some((route) => route.path === "login")).toBe(true);
    expect(routeChildren.some((route) => route.path === "account")).toBe(true);
  });
});


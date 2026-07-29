import { describe, expect, it } from "vitest";
import { routeChildren, routes } from "@/router";

describe("router", () => {
  it("ノート一覧とワークスペースのルートを持つ", () => {
    const notesRoute = routeChildren.find((route) => route.path === "notes");
    const workspaceRoute = routeChildren.find((route) => route.path === "notes/:noteId");

    expect(notesRoute?.meta?.requiresPersistentUserData).toBe(true);
    expect(workspaceRoute?.meta?.requiresPersistentUserData).toBe(true);
  });

  it("言語prefix付きURLをprefixなしURLへリダイレクトする", () => {
    const redirectRoute = routes.find((route) => route.path === "/:lang(en|ja)/:rest(.*)");
    const redirect = redirectRoute?.redirect as (to: { params: { rest: string } }) => string;

    expect(redirect({ params: { rest: "notes" } })).toBe("/notes");
  });

  it("通常ルートに言語prefix用の子ルートを持たない", () => {
    expect(routeChildren.some((route) => route.path.includes(":lang"))).toBe(false);
  });

  it("パネルを別タブで開く専用ルートを持たない", () => {
    expect(routeChildren.some((route) => route.path === "notes/:noteId/panels/:panelId")).toBe(false);
  });
});
